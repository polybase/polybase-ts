export const POLYBASE_AUTH_CSS_PREFIX = 'polybase-auth-'
export const POLYBASE_AUTH_MODAL_ID = 'polybase-auth-modal'
export const POLYBASE_AUTH_MODAL_IFRAME_ID = `${POLYBASE_AUTH_MODAL_ID}-iframe`
export const POLYBASE_DEFAULT_IFRAME_URL = 'https://auth.testnet.polybase.xyz'

export class Modal {
  id: string
  iframe: HTMLIFrameElement
  modal: HTMLDivElement

  constructor(id: string, src?: string) {
    this.id = id
    this.iframe = document.createElement('iframe')
    this.iframe.src = src ?? POLYBASE_DEFAULT_IFRAME_URL
    this.modal = document.createElement('div')
    this.modal.onclick = () => {
      this.hide()
    }

    // Append to document
    if (['interactive', 'complete'].indexOf(document.readyState) > -1) {
      createModal(this.modal, this.iframe, src)
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        createModal(this.modal, this.iframe, src)
      })
    }
  }

  show = (url?: string) => {
    this.modal.style.display = 'flex'
    if (url && this.iframe.src !== url) {
      this.iframe.src = url
    }
  }

  hide = () => {
    this.modal.style.display = 'none'
  }
}

export function createModal(modal: HTMLDivElement, iframe: HTMLIFrameElement, url?: string) {
  // Create the modal element
  modal.id = 'polybase-auth-modal'
  modal.style.display = 'none'
  modal.classList.add(`${POLYBASE_AUTH_CSS_PREFIX}modal`)

  // Create iframe
  iframe.id = POLYBASE_AUTH_MODAL_IFRAME_ID
  iframe.src = url ?? POLYBASE_DEFAULT_IFRAME_URL
  iframe.classList.add(`${POLYBASE_AUTH_CSS_PREFIX}modal-iframe`)
  iframe.style.colorScheme = 'normal'

  // Append the modal content container to the modal element
  modal.appendChild(iframe)

  // Append the modal to the body
  document.body.appendChild(modal)

  // Append styles
  const css = document.createElement('style')
  css.innerHTML = `
    .${POLYBASE_AUTH_CSS_PREFIX}modal {
      position: fixed; /* positioned relative to the viewport */
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483647;
      display: none;
    }
    
    .${POLYBASE_AUTH_CSS_PREFIX}modal-iframe{
      width: 100%;
      height: 100%;
      border: none;
    }
  `
  document.body.appendChild(css)

  return modal
}
