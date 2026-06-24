import { useState } from 'react'
import { Button, Flex, Heading, Text } from '@radix-ui/themes'
import { CheckIcon } from '@radix-ui/react-icons'
import { BRAND_LOGOS } from '../../data.js'

export const WaMark = ({ s = 19 }) => (
  <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="16" fill="#25D366"/>
    <path fill="#fff" d="M16 6.5c-5.2 0-9.4 4.2-9.4 9.4 0 1.8.5 3.5 1.4 5L6.5 25.5l4.7-1.5c1.4.8 3.1 1.3 4.8 1.3 5.2 0 9.4-4.2 9.4-9.4S21.2 6.5 16 6.5zm5.5 13.3c-.2.7-1.4 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.9.8 2 .1.1.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.4.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.3.1 1.7.8 2 1 .3.1.5.2.5.3.1.2.1.7-.1 1.2z"/>
  </svg>
)

export function LoginGate({ onDone }) {
  const [tab, setTab] = useState('phone')
  const [stage, setStage] = useState('cred')
  const [ph, setPh] = useState('')
  const [em, setEm] = useState('')
  const [otp, setOtp] = useState('')
  const [reqSent, setReqSent] = useState(false)
  const h = new Date().getHours()
  const greet = h < 12 ? 'GOOD MORNING' : h < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING'
  const ready = tab === 'phone' ? ph.length === 10 : /\S+@\S+\.\S+/.test(em)
  return (
    <div className="login2">
      <Text size="1" weight="bold" as="div" style={{ color: 'var(--green-10)', letterSpacing: '.9px', fontSize: 11, marginTop: 36 }}>
        {stage === 'otp' ? 'ALMOST THERE' : greet}
      </Text>
      <Heading as="h2" style={{ fontSize: 31, letterSpacing: '-1px', marginTop: 4 }}>
        {stage === 'otp' ? 'One last step' : 'Welcome back, partner'}
      </Heading>
      {stage === 'cred' && (
        <Text size="2" color="gray" as="div" mt="2" style={{ lineHeight: 1.5 }}>
          Your counter's command centre — orders, credit and margins in one place.
        </Text>
      )}
      {stage === 'cred' ? (
        <>
          <div className="lg-tabs">
            <button className={tab === 'phone' ? 'on' : ''} onClick={() => setTab('phone')}>Phone number</button>
            <button className={tab === 'email' ? 'on' : ''} onClick={() => setTab('email')}>Email</button>
          </div>
          {tab === 'phone' ? (
            <div className="lg-group">
              <span>+91</span>
              <input
                type="tel" autoComplete="tel" inputMode="numeric" maxLength={10} placeholder="Phone number" aria-label="Phone number"
                value={ph} onChange={(e) => setPh(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          ) : (
            <div className="lg-group">
              <input type="email" placeholder="Work email" value={em} onChange={(e) => setEm(e.target.value)} />
            </div>
          )}
          <Text size="1" color="gray" as="div" mt="3" style={{ lineHeight: 1.55 }}>
            We'll send a verification code. By continuing you agree to our{' '}
            <span className="lg-link">Dealer Terms</span> & <span className="lg-link">Privacy Policy</span>.
          </Text>
          <button className="lg-cta" disabled={!ready} onClick={() => setStage('otp')}>Continue</button>
          <Text size="1" color="gray" as="div" mt="2" style={{ textAlign: 'center' }}>
            Demo build — no SMS goes out
          </Text>
          <div className="lg-or"><span>or</span></div>
          <button className="lg-soc wa" onClick={onDone}><WaMark /> Continue with WhatsApp</button>
          <Text size="2" as="div" mt="4" style={{ textAlign: 'center' }}>
            or <button type="button" className="lg-link" onClick={onDone}>continue as guest</button>
          </Text>
          <div className="lg-new">
            <Text size="2" weight="bold" as="div">New to QuickCart?</Text>
            <Text size="1" color="gray" as="div" mt="1" style={{ lineHeight: 1.55 }}>
              Extra margins, 30-day credit and 1-hour delivery for registered dealers.
            </Text>
            {reqSent ? (
              <Flex align="center" gap="2" mt="2">
                <CheckIcon width={13} height={13} color="var(--green-11)" />
                <Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>
                  Request received — we'll call within 4 working hours
                </Text>
              </Flex>
            ) : (
              <Button mt="2" size="2" variant="soft" color="green" radius="full" style={{ fontWeight: 800 }} onClick={() => setReqSent(true)}>
                Request a dealer account
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <Text size="2" color="gray" as="div" mt="2">
            Sent to {tab === 'phone' ? `+91 ${ph}` : em} · any 4 digits work in this demo
          </Text>
          <input
            className="lg-otp" autoComplete="one-time-code" inputMode="numeric" maxLength={4} placeholder="••••" aria-label="One-time code"
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <button className="lg-cta" disabled={otp.length !== 4} onClick={onDone}>Verify & continue</button>
          <Text size="2" as="div" mt="4" style={{ textAlign: 'center' }}>
            <button type="button" className="lg-link" onClick={() => setStage('cred')}>Change number</button>
          </Text>
        </>
      )}
      <div className="lg-brands">
        {Object.values(BRAND_LOGOS).map((src, i) => <img key={i} src={src} alt="" />)}
      </div>
    </div>
  )
}
