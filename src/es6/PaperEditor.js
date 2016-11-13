import React from 'react';
import draft from 'draft-js';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TextField from 'material-ui/TextField';
import Paper from 'material-ui/Paper';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import FlatButton from 'material-ui/FlatButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import Dialog from 'material-ui/Dialog';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import Immutable from 'immutable';
import fetches from './fetch';
import exportPDF from './export';

const { fetch } = fetches;

const { Editor, EditorState, RichUtils, Entity, Modifier, convertToRaw, convertFromRaw } = draft;
const { List, Map } = Immutable;

export default class PaperEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      firstname: '',
      lastname: '',
      instructor: '',
      course: '',
      title: '',
      wc_doi: '',
      email: '',
      citationOpen: false,
      citations: List.of(),
      editOpen: true,
      emailOpen: false,
      editorState: EditorState.createEmpty(),
    };
    if (!localStorage.getItem('_')) localStorage.setItem('_', '[]');
    const existingStateKeys = JSON.parse(localStorage.getItem('_'));
    existingStateKeys.forEach((key) => {
      const content = JSON.parse(localStorage.getItem(key));
      if (key === 'editorState') {
        this.state[key] = EditorState.createWithContent(
          convertFromRaw(content),
        );
      } else {
        this.state[key] = Immutable.fromJS(content);
      }
    });
    this.onChange = this.onChange.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.save = this.save.bind(this);
    const originalSetState = this.setState.bind(this);
    this.setState = (update) => {
      Object.keys(update).forEach((x) => {
        if (x === 'editorState') {
          const newState = update[x];
          const content = newState.getCurrentContent();
          localStorage.setItem(x, JSON.stringify(convertToRaw(content)));
        } else if (update[x] instanceof List) {
          localStorage.setItem(x, JSON.stringify(update[x].toArray()));
        } else if (update[x] instanceof Map) {
          localStorage.setItem(x, JSON.stringify(update[x].toObject()));
        } else {
          localStorage.setItem(x, JSON.stringify(update[x]));
        }

        const previous = JSON.parse(localStorage.getItem('_'));
        if (!previous.includes(x)) {
          previous.push(x);
          localStorage.setItem('_', JSON.stringify(previous));
        }
      });
      originalSetState(update);
    };
  }

  onChange(editorState) {
    this.setState({ editorState });
  }

  handleKeyCommand(command) {
    if (command === 'bold') return 'not-handled';
    const newState = RichUtils.handleKeyCommand(this.state.editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  save() {
    exportPDF(this.state.editorState.getCurrentContent(), {
      firstname: this.state.firstname,
      lastname: this.state.lastname,
      instructor: this.state.instructor,
      course: this.state.course,
      title: this.state.title,
      citations: this.state.citations,
    });
  }

  render() {
    const { editorState } = this.state;
    return (<MuiThemeProvider>
      <div>
        <AppBar
          title={this.state.title}
          iconElementLeft={(<IconMenu
            iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
            targetOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
          >
            <MenuItem
              primaryText="Edit Details"
              onTouchTap={() => this.setState({ editOpen: true })}
            />
            <MenuItem
              primaryText="New Paper" onClick={() => {
                localStorage.setItem('_', '[]');
                this.setState({
                  firstname: '',
                  lastname: '',
                  instructor: '',
                  course: '',
                  title: '',
                  editorState: EditorState.createEmpty(),
                  editOpen: true,
                });
              }}
            />
            <MenuItem
              primaryText="Get Reminded" onClick={() => {
                localStorage.setItem('_', '[]');
                this.setState({
                  email: '',
                  emailOpen: true,
                });
              }}
            />
          </IconMenu>)}
          iconElementRight={<FlatButton label="Save" onClick={this.save} />}
        />
        <Paper zDepth={2} style={{ padding: 20 }}>
          <Editor
            editorState={editorState}
            onChange={this.onChange}
            handleKeyCommand={this.handleKeyCommand}
          />
        </Paper>
        <Dialog
          title="Edit Details"
          actions={[
            <FlatButton
              label="OK"
              primary
              onTouchTap={() => this.setState({ editOpen: false })}
            />,
          ]}
          open={this.state.editOpen}
        >
          <TextField
            value={this.state.firstname}
            floatingLabelText="First name"
            onChange={event => this.setState({ firstname: event.target.value })}
            errorText={!this.state.firstname && 'Required'}
          />
          <TextField
            value={this.state.lastname}
            floatingLabelText="Last name"
            onChange={event => this.setState({ lastname: event.target.value })}
            errorText={!this.state.lastname && 'Required'}
          />
          <TextField
            value={this.state.instructor}
            floatingLabelText="Instructor name"
            onChange={event => this.setState({ instructor: event.target.value })}
            errorText={!this.state.instructor && 'Required'}
          />
          <TextField
            value={this.state.course}
            floatingLabelText="Course name"
            onChange={event => this.setState({ course: event.target.value })}
            errorText={!this.state.course && 'Required'}
          />
          <TextField
            value={this.state.title}
            floatingLabelText="Title"
            onChange={event => this.setState({ title: event.target.value })}
            errorText={!this.state.title && 'Required'}
            fullWidth
          />
        </Dialog>
        <FloatingActionButton style={{ position: 'absolute', right: '25px', bottom: '25px' }} onClick={() => this.setState({ citationOpen: true })}>
          <ContentAdd />
        </FloatingActionButton>
        <Dialog
          title="Add Citation"
          actions={[
            <FlatButton
              label="OK"
              primary
              disabled={!this.state.wc_title || !this.state.wc_doi}
              onTouchTap={() => (async function addCitation() {
                this.setState({ citationOpen: false });
                const citation = (await (await fetch(`http://api.crossref.org/works/${this.state.wc_doi}`)).json()).message;
                console.log(`${citation.author[0].family}, ${citation.author[0].given}. ${citation.title[0]} ${citation['container-title'][0]}, vol. ${citation.volume}, issue ${citation.issue}, ${citation.created['date-parts'][0][0]}, page(s) ${citation.page}`);
                const entity = Entity.create('MENTION', 'IMMUTABLE', citation);
                this.setState({
                  editorState: EditorState.push(
                    this.state.editorState,
                    Modifier.applyEntity(
                      this.state.editorState.getCurrentContent(),
                      this.state.editorState.getSelection(),
                      entity,
                    ),
                  ),
                  citations: this.state.citations.push(Immutable.fromJS(citation)),
                  wc_doi: '',
                  wc_title: '',
                });
              }).bind(this)()}
            />,
          ]}
          open={this.state.citationOpen}
        >
          <TextField
            value={this.state.wc_doi}
            floatingLabelText="DOI"
            onChange={event => (async function update() {
              this.setState({ wc_doi: event.target.value });
              try {
                const citation = (await (await fetch(`http://api.crossref.org/works/${event.target.value}`)).json()).message;
                this.setState({ wc_title: `"${citation.title[0]}" by ${citation.author[0].given} ${citation.author[0].family} in ${citation['container-title'][0]}` });
              } catch (e) {
                this.setState({ wc_title: '' });
              }
            }).bind(this)()}
            errorText={(!this.state.wc_title || !this.state.wc_doi) && 'Not found'}
            fullWidth
          />
          <span>{this.state.wc_title}</span>
        </Dialog>
        <Dialog
          title="Get Reminders"
          actions={[
            <FlatButton
              label="OK"
              primary
              disabled={!this.state.email}
              onTouchTap={() => (async function addCitation() {
                this.setState({ emailOpen: false });
                await (await fetch(`http://54.235.226.255:3000/${this.state.email}`)).text();
              }).bind(this)()}
            />,
          ]}
          open={this.state.emailOpen}
        >
          <TextField
            value={this.state.email}
            floatingLabelText="E-Mail Address"
            onChange={() => this.setState({ email: event.target.value })}
            errorText={!this.state.email && 'Required'}
            fullWidth
          />
        </Dialog>
      </div>
    </MuiThemeProvider>);
  }
}
