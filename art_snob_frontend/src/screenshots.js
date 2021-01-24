import { useState } from 'react'
import html2canvas from 'html2canvas'

const useScreenshot = () => {
  const [image, setImage] = useState(null)
  const [error, setError] = useState(null)
  const takeScreenShot = (node) => {
    if (!node) {
      throw new Error('You should provide correct html node.')
    }
    return html2canvas(node, {allowTaint: true, useCORS: true, scale: 10})
    .then((canvas) => {
        const croppedCanvas = document.createElement('canvas')
        const croppedCanvasContext = croppedCanvas.getContext('2d')
        // init data
        const cropPositionTop = 0
        const cropPositionLeft = 0
        const cropWidth = canvas.width
        const cropHeight = canvas.height

        croppedCanvas.width = cropWidth
        croppedCanvas.height = cropHeight

        croppedCanvasContext.drawImage(
          canvas,
          cropPositionLeft,
          cropPositionTop,
        )

        const base64Image = croppedCanvas.toDataURL()

        setImage(base64Image)
        return base64Image
      })
      .catch(setError)
  }

  return [
    image,
    takeScreenShot,
    {
      error,
    },
  ]
}

const createFileName = (extension = '', ...names) => {
  if (!extension) {
    return ''
  }

  return `${names.join('')}.${extension}`
}

export { useScreenshot, createFileName }