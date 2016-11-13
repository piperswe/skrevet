import React from 'react';
import ReactDOM from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import PaperEditor from './PaperEditor';

injectTapEventPlugin();

ReactDOM.render(<PaperEditor />, document.getElementById('editor'));
