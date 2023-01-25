export const POLYBASE_AUTH_CSS_PREFIX = 'polybase-auth-'
export const POLYBASE_AUTH_MODAL_ID = 'polybase-auth-modal'
export const POLYBASE_AUTH_MODAL_IFRAME_ID = `${POLYBASE_AUTH_MODAL_ID}-iframe`
export const POLYBASE_DEFAULT_IFRAME_URL = 'https://auth.polybase.xyz'

export class Modal {
  id: string
  iframe: HTMLIFrameElement
  modal: HTMLDivElement

  constructor (id: string, src?: string) {
    this.id = id
    this.iframe = document.createElement('iframe')
    this.iframe.src = src ?? POLYBASE_DEFAULT_IFRAME_URL
    this.modal = document.createElement('div')
    this.modal.onclick = () => {
      this.hide()
    }

    // Append to document
    document.addEventListener('DOMContentLoaded', () => {
      createModal(this.modal, this.iframe, src)
    })
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

export function createModal (modal: HTMLDivElement, iframe: HTMLIFrameElement, url?: string) {
  // Create the modal element
  modal.id = 'polybase-auth-modal'
  modal.style.display = 'none'
  modal.classList.add(`${POLYBASE_AUTH_CSS_PREFIX}modal`)

  // Create the modal content container
  const modalContent = document.createElement('div')
  modalContent.classList.add(`${POLYBASE_AUTH_CSS_PREFIX}modal-content`)

  // Create iframe
  iframe.id = POLYBASE_AUTH_MODAL_IFRAME_ID
  iframe.src = url ?? POLYBASE_DEFAULT_IFRAME_URL
  iframe.classList.add(`${POLYBASE_AUTH_CSS_PREFIX}modal-iframe`)

  // Append the iframe to the modal content container
  modalContent.appendChild(iframe)

  // Append the modal content container to the modal element
  modal.appendChild(modalContent)

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
      background-color: rgba(0, 0, 0, 0.75);
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      display: none;
    }
    
    .${POLYBASE_AUTH_CSS_PREFIX}modal-content {
      background-color: white;
      border-radius: 10px;
      overflow: hidden;
      height: 400px;
      max-width: 340px;
      width: 100%;
      box-shadow: 0px 3px 6px rgb(0 0 0 / 16%), 0px 3px 6px rgb(0 0 0 / 23%);
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
