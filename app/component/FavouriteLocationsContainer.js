import React, { PropTypes } from 'react';
import Relay from 'react-relay';
import { routerShape, locationShape } from 'react-router';
import connectToStores from 'fluxible-addons-react/connectToStores';
import SwipeableViews from 'react-swipeable-views';
import { virtualize, bindKeyboard } from 'react-swipeable-views-utils';
import flowRight from 'lodash/flowRight';
import FavouriteLocationContainer from './FavouriteLocationContainer';
import FavouriteLocation from './FavouriteLocation';
import EmptyFavouriteLocationSlot from './EmptyFavouriteLocationSlot';
import ComponentUsageExample from './ComponentUsageExample';
import { setEndpoint } from '../action/EndpointActions';

class FavouriteLocationContainerRoute extends Relay.Route {
  static queries = {
    plan: (Component, variables) => Relay.QL`
    query {
      viewer {
        ${Component.getFragment('plan', {
          from: variables.from,
          to: variables.to,
          maxWalkDistance: variables.maxWalkDistance,
          wheelchair: variables.wheelchair,
          preferred: variables.preferred,
          arriveBy: variables.arriveBy,
          disableRemainingWeightHeuristic: variables.disableRemainingWeightHeuristic,
        })}
      }
    }`,
  };
  static paramDefinitions = {
    from: { required: true },
    to: { required: true },
  };
  static routeName = 'FavouriteLocationsContainerRoute';
}


const VirtualizeSwipeableViews = flowRight(
  bindKeyboard,
  virtualize,
)(SwipeableViews);


export class FavouriteLocationsContainer extends React.Component {

  static contextTypes = {
    executeAction: React.PropTypes.func.isRequired,
    router: routerShape.isRequired,
    location: locationShape.isRequired,
    config: React.PropTypes.object.isRequired,
  };

  static description =
    <div>
      <p>Renders a container with favourite locations</p>
      <ComponentUsageExample description="">
        <FavouriteLocationsContainer />
      </ComponentUsageExample>
    </div>;

  static propTypes = {
    favourites: PropTypes.array.isRequired,
    currentTime: PropTypes.object.isRequired,
    location: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lon: PropTypes.number.isRequired,
    }),
  };

  constructor() {
    super();
    this.state = { slideIndex: 0 };
  }

  onSwitching = (index, type) => {
    if (type === 'end') {
      if (index > this.props.favourites.length - 2) {
        this.setState({ slideIndex: index }, () => {
          this.setState({ slideIndex: Math.max(0, this.props.favourites.length - 2) });
        });
      }
    }
  }

  setDestination = (locationName, lat, lon) => {
    const location = {
      lat,
      lon,
      address: locationName,
    };

    this.context.executeAction(setEndpoint, {
      target: 'destination',
      endpoint: location,
      router: this.context.router,
      location: this.context.location,
    });
  }

  slideRenderer = ({ key, index }) => {
    // add-new slot at the end
    if (index === this.props.favourites.length) {
      return <EmptyFavouriteLocationSlot key={key} index={index} />;
    }

    const favourite = this.props.favourites[index];

    const favouriteLocation = (<FavouriteLocation
      key={key}
      favourite={favourite} clickFavourite={this.setDestination}
    />);

    if (this.props.location) {
      const config = this.context.config;

      return (<Relay.RootContainer
        Component={FavouriteLocationContainer} forceFetch
        route={new FavouriteLocationContainerRoute({
          from: {
            lat: this.props.location.lat,
            lon: this.props.location.lon,
          },

          to: {
            lat: favourite.lat,
            lon: favourite.lon,
          },

          maxWalkDistance: config.maxWalkDistance + 0.1,
          wheelchair: false,

          preferred: {
            agencies: config.preferredAgency || '',
          },

          arriveBy: false,
          disableRemainingWeightHeuristic: false,
        })} renderLoading={() => (favouriteLocation)
        } renderFetched={data => (
          <FavouriteLocationContainer
            favourite={favourite}
            onClickFavourite={this.setDestination}
            currentTime={this.props.currentTime.unix()}
            {...data}
          />)
        }
      />);
    }
    return favouriteLocation;
  }

  render() {
    const styles = {
      root: {
        padding: '0 0px',
        overflowX: 'visible',
        width: '100%',
      },
      slideContainer: {
        padding: '0 0px',
      },
    };
    return (
      <div key={`fav-locations-${this.props.favourites.length}`} style={{ width: '36%' }} >
        <VirtualizeSwipeableViews
          slideRenderer={this.slideRenderer}
          style={styles.root} slideStyle={styles.slideContainer}
          slideCount={this.props.favourites.length + 1}
          index={this.state.slideIndex}
          onSwitching={this.onSwitching}
          overscanSlideAfter={3}
        />
      </div>
    );
  }
}

export default connectToStores(FavouriteLocationsContainer,
  ['TimeStore', 'FavouriteLocationStore', 'EndpointStore'],
     (context) => {
       const position = context.getStore('PositionStore').getLocationState();
       const origin = context.getStore('EndpointStore').getOrigin();

       return {
         currentTime: context.getStore('TimeStore').getCurrentTime(),
         favourites: context.getStore('FavouriteLocationStore').getLocations(),

         location: (() => {
           if (origin.useCurrentPosition) {
             if (position.hasLocation) {
               return position;
             }
             return null;
           }

           return origin;
         })(),
       };
     });
