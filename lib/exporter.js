const { dialog } = require('@electron/remote')
const path = require('path')
const sanitize = require('sanitize-filename')
const fs = require('fs')
const touch = require('touch')
const { exportImage } = require('inkdrop-export-utils')
const { logger } = require('inkdrop')
const { Note } = require('inkdrop').models

module.exports = {
  exportSingleNote
}

async function exportSingleNote(note) {
  const { filePath: pathToSave } = await dialog.showSaveDialog({
    title: 'Save Markdown File (articles/slug_id.md)',
    defaultPath: `${note.title}.md`,
    filters: [{ name: 'Markdown File', extensions: ['md'] }]
  })
  if (pathToSave) {
    try {
      const destDir = path.dirname(pathToSave)
      const fileName = path.basename(pathToSave, '.md')
      await exportNote(note, destDir, fileName)
    } catch (e) {
      logger.error('Failed to export editing note:', e, note)
      inkdrop.notifications.addError('Failed to export editing note', {
        detail: e.message,
        dismissable: true
      })
    }
  }
}

async function exportNote(note, pathToSave, fileName) {
  if (note.body) {
    const filePath = path.join(pathToSave, fileName + '.md')
    let body = note.body
	const imagePath = path.resolve(pathToSave, '../images/' + fileName + '/')
	const basePath = path.resolve(pathToSave, '../')
	fs.mkdir(imagePath, { recursive: true }, (err) => {
    	if (err) throw err;
	});
    body = await replaceImages(body, imagePath, basePath)

    fs.writeFileSync(filePath, body)
    touch.sync(filePath, { time: new Date(note.updatedAt) })
  }
}

async function replaceImages(
  body,
  dirToSave,
  basePath
) {
  // find attachments
  const uris = body.match(/inkdrop:\/\/file:[^) "']*/g) || []
  for (let i = 0; i < uris.length; ++i) {
    const uri = uris[i]
    let imagePath = await exportImage(uri, dirToSave)
    if (typeof imagePath === 'string') {
      if (basePath) imagePath = path.relative(basePath, imagePath).replaceAll(path.sep, '/')
      body = body.replace(uri, '/' + imagePath)
    }
  }
  return body
}