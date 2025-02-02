import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { jwtMaster } from './jwtResourceAccessWrapper'


@customElement('login-status')
export class LoginStatus extends LitElement {
  @state()
  private username:string
  @state()
  private email:string
  @state()
  private exp:string
  @state()
  private minutesLeft: number
  private intervalId: number | undefined

  constructor(){
    super()
    this.username = jwtMaster.getClaim('name')
    this.email = jwtMaster.getClaim('email')
    this.exp = jwtMaster.getClaim('exp')
    this.minutesLeft = Math.floor(( Number(this.exp) - Math.floor(Date.now()/1000) ) / 60) + 1
  }

  connectedCallback() {
    super.connectedCallback();
    this.startCountdown();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopCountdown();
  }

  startCountdown() {
    this.stopCountdown(); // Clear any existing interval
    this.intervalId = window.setInterval(() => {
      if (this.minutesLeft > 0) {
        this.minutesLeft -= 1; // Decrease the minutes by 1 each interval
      } else {
        this.stopCountdown(); // Stop the countdown when it reaches 0
      }
    }, 60000); // 60000ms = 1 minute
  }

  stopCountdown() {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  counterMessage(){
    return this.minutesLeft ? `Session ends in ${this.minutesLeft}m` : 'Session expired'
  }

  render() {
    return html`
      <div>
        <div>Hello ${this.username}</div>
        <div>${this.email}</div>
        <div>
          <div style="color: ${this.minutesLeft>9 ? 'inherit':'red'};">${this.counterMessage()} </div>
          <a href="/logout" target="_self" alt="Logout">Logout</a>
        </div>
      </div>
    `
  }


  static styles = css`
    :host {
      text-align: right;
      line-height: 1.3;
    }
    a {
      font-weight: 500;
      color: white;
      text-decoration: none;
    }
    a:hover {
      color: black;
      text-decoration: underline;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'login-status': LoginStatus
  }
}
