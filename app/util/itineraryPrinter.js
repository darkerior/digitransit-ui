import pdfMake from 'pdfmake/build/pdfmake';
import 'pdfmake/build/vfs_fonts';

import { getImageFromSpriteCache } from './mapIconUtils';

function imageToDataUri(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  canvas.getContext('2d').drawImage(image, 0, 0);

  return canvas.toDataURL('image/png');
}

const DPI_RATIO = 600 / 72;

// eslint-disable-next-line import/prefer-default-export
export async function print(itinerary) {
  const [
    logo,
    timeIcon,
    walkIcon,
    ticketIcon,
  ] = (await Promise.all([
    getImageFromSpriteCache('icon-icon_HSL-logo', 50 * DPI_RATIO, 50 * DPI_RATIO),
    getImageFromSpriteCache('icon-icon_time', 50 * DPI_RATIO, 50 * DPI_RATIO),
    getImageFromSpriteCache('icon-icon_walk', 50 * DPI_RATIO, 50 * DPI_RATIO),
    getImageFromSpriteCache('icon-icon_ticket-machine', 50 * DPI_RATIO, 50 * DPI_RATIO),
  ])).map(imageToDataUri);

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: 40,
    content: [{
      columns: [{
        width: '*',
        text: [
          'HSL Reittiopas - Reittiohje\n',
          `${itinerary.legs[0].from.name} - ${itinerary.legs[itinerary.legs.length - 1].from.name}`,
        ],
      }, {
        stack: [{
          image: logo,
          width: 50,
        }],
        width: 50,
        margin: [0, 0, 0, 20],
      }],
    }, {
      table: {
        widths: [50, 'auto', 50, 'auto', 50, '*'],
        body: [[{
          border: [false, true, false, true],
          stack: [{
            image: timeIcon,
            width: 50,
          }],
        }, {
          border: [false, true, false, true],
          stack: ['Matka-aika'],
        }, {
          border: [false, true, false, true],
          stack: [{
            image: walkIcon,
            width: 50,
          }],
        }, {
          border: [false, true, false, true],
          stack: ['Kävelyä'],
        }, {
          border: [false, true, false, true],
          stack: [{
            image: ticketIcon,
            width: 50,
          }],
        }, {
          border: [false, true, false, true],
          stack: ['Tarvittava lippu'],
          width: '*',
        }]],
      },
      width: '*',
    }],
  };

  pdfMake.createPdf(docDefinition).download();
}
