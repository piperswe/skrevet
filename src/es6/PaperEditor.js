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
import exportPDF from './export';

const { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } = draft;

export default class PaperEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      firstname: '',
      lastname: '',
      instructor: '',
      course: '',
      title: '',
      editOpen: true,
      editorState: EditorState.createEmpty(),
    };
    if (!localStorage.getItem('_')) localStorage.setItem('_', '[]');
    const existingStateKeys = JSON.parse(localStorage.getItem('_'));
    existingStateKeys.forEach((key) => {
      if (key === 'editorState') {
        this.state[key] = EditorState.createWithContent(
          convertFromRaw(JSON.parse(localStorage.getItem(key))),
        );
      } else {
        this.state[key] = JSON.parse(localStorage.getItem(key));
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
      </div>
    </MuiThemeProvider>);
  }
}
