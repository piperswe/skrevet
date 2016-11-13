import * as draftJSExportHTML from 'draft-js-export-html';
import JSPDF from 'jspdf';
import moment from 'moment';
import slugify from 'slugify';

// eslint-disable-next-line
const { stateToHTML } = draftJSExportHTML.__moduleExports;

const style = '<style>p{line-height:200%;}</style>';

JSPDF.API.centeredText = function centeredText(x, y, txt) {
  const fontSize = this.internal.getFontSize();
  const pageWidth = this.internal.pageSize.width;
  const txtWidth = (this.getStringUnitWidth(txt) * fontSize) / this.internal.scaleFactor;
  const newX = (pageWidth - txtWidth) / 2;
  this.text(newX, y, txt);
};

export default function (contentState, details) {
  const doc = new JSPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
    lineHeight: 2,
  });
  doc.setFont('times');
  doc.setFontType('normal');
  doc.setFontSize(12);
  doc.text(72, 72 + (0 * 2 * 12), `${details.lastname}, ${details.firstname}\n${details.instructor}\n${details.course}\n${moment().format('DD MMMM YYYY')}`);
  doc.centeredText(72, 72 + (4 * 2 * 12), details.title);
  doc.fromHTML(style + stateToHTML(contentState), 72, 72 + (4 * 2 * 12), {
    width: 468,
    elementHandlers: {
      '#editor': () => true,
    },
  });

  doc.save(`${slugify(details.title)}.pdf`);
}
