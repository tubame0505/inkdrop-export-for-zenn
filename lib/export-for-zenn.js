'use babel';

const { logger } = require('inkdrop');
const { Note } = require('inkdrop').models;

module.exports = {
  activate() {
  	this.subscription = inkdrop.commands.add(document.body, {
  		'export-for-zenn:selections': () => this.exportSelectedNotes()
  	})
  },

  deactivate() {
    this.subscription.dispose()
  },
  
  async exportSelectedNotes() {
	const { exportSingleNote } = require('./exporter')
    const { noteListBar, notes } = inkdrop.store.getState()
    const { actionTargetNoteIds } = noteListBar
	if (actionTargetNoteIds.length === 1) {
	    const note = await Note.loadWithId(actionTargetNoteIds[0])
		exportSingleNote(note)
	} else if (actionTargetNoteIds && actionTargetNoteIds.length > 1) {
      inkdrop.notifications.addError('Multiple note opened', {
        detail: 'Please open a note to export',
        dismissable: true
      })
	} else {
      inkdrop.notifications.addError('No note opened', {
        detail: 'Please open a note to export',
        dismissable: true
      })
	}
  },

};
