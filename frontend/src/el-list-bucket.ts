import { LitElement, css, html } from 'lit'
import { customElement, state, } from 'lit/decorators.js'
import { awsMaster } from './awsResourceAccessWrapper'
 


/**
 * An example element.
 * Lists all files in a bucket
 */
@customElement('list-bucket')
export class ListBucket extends LitElement {
  @state() bucketEntries: string[] = []

  constructor(){
    super()

    awsMaster.listBucketPromise()
      .then((data)=>{this.bucketEntries = [...data.Contents]})
      .catch(console.error)
  }

  render() {
    return html`
      <div>
        <ul>
          ${this.bucketEntries.map((item:any) => html`<li>${item.Key}</li>`)}
        </ul>
      </div>
    `
  }

  static styles = css`
    :host {
      font-size: 10px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'list-bucket': ListBucket
  }
}
