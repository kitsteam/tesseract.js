const resolveURL = require('resolve-url');
const blueimp = require('blueimp-load-image');

/**
 * readFromBlobOrFile
 *
 * @name readFromBlobOrFile
 * @function
 * @access private
 */
const readFromBlobOrFile = blob => (
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = ({ target: { error: { code } } }) => {
      reject(Error(`File could not be read! Code=${code}`));
    };
    fileReader.readAsArrayBuffer(blob);
  })
);

const fixOrientationFromUrlOrBlobOrFile = blob => (
  new Promise((resolve) => {
    blueimp(blob, (img) => img.toBlob(resolve, 'image/jpeg'), {orientation: true})
  })
)

/**
 * loadImage
 *
 * @name loadImage
 * @function load image from different source
 * @access private
 */
const loadImage = async (image) => {
  let data = image;
  if (typeof image === 'undefined') {
    return 'undefined';
  }

  if (typeof image === 'string') {
    // Base64 Image
    if (/data:image\/([a-zA-Z]*);base64,([^"]*)/.test(image)) {
      data = atob(image.split(',')[1])
        .split('')
        .map(c => c.charCodeAt(0));
    } else {
      image = await fixOrientationFromUrlOrBlobOrFile(resolveURL(image));
      data = await readFromBlobOrFile(image);
    }
  } else if (image instanceof HTMLElement) {
    if (image.tagName === 'IMG') {
      data = await loadImage(image.src);
    }
    if (image.tagName === 'VIDEO') {
      data = await loadImage(image.poster);
    }
    if (image.tagName === 'CANVAS') {
      await new Promise((resolve) => {
        image.toBlob(async (blob) => {
          data = await readFromBlobOrFile(blob);
          resolve();
        });
      });
    }
  } else if (image instanceof File || image instanceof Blob) {
    image = await fixOrientationFromUrlOrBlobOrFile(image);
    data = await readFromBlobOrFile(image);
  }

  return new Uint8Array(data);
};

module.exports = loadImage;
