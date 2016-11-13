import * as draftJSExportHTML from 'draft-js-export-html';
import JSPDF from 'jspdf';
import moment from 'moment';
import slugify from 'slugify';

// eslint-disable-next-line
const { stateToHTML } = draftJSExportHTML.__moduleExports;

const style = '<style>p{line-height:200%;text-indent:1em;}</style>';

JSPDF.API.centeredText = function centeredText(x, y, txt) {
  const fontSize = this.internal.getFontSize();
  const pageWidth = this.internal.pageSize.width;
  const txtWidth = (this.getStringUnitWidth(txt) * fontSize) / this.internal.scaleFactor;
  const newX = (pageWidth - txtWidth) / 2;
  this.text(newX, y, txt);
};

function citeMLA(citation) {
  let title = citation.get('title').get(0);
  if (!title.endsWith('.')) title = `${title}.`;
  return `${citation.get('author').get(0).get('family')}, ${citation.get('author').get(0).get('given')}. <em>${title}</em> ${citation.get('container-title').get(0)}, vol. ${citation.get('volume')}, issue ${citation.get('issue')}, ${citation.get('created').get('date-parts').get(0).get(0)}, page(s) ${citation.get('page')}`;
}

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

  doc.addPage();
  doc.centeredText(72, 72 + (0 * 2 * 12), 'Works Cited');
  doc.fromHTML(`${style}<p>${details.citations.map(citeMLA).join('<p>')}`, 72, 72, {
    width: 468,
    elementHandlers: {
      '#editor': () => true,
    },
  });

  doc.save(`${slugify(details.title)}.pdf`);
}
