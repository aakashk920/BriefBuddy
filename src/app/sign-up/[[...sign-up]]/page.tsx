import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="mesh-bg min-h-screen flex flex-col items-center justify-center px-4 relative">
      <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full bg-indigo-600/8 blur-3xl pointer-events-none" />

      <Link href="/" className="flex items-center gap-2 mb-10 animate-fade-up">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg">
          🧠
        </div>
        <span className="text-xl font-bold font-[var(--font-syne)] gradient-text">BriefBuddy</span>
      </Link>

      <div className="animate-fade-up stagger-2">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary:            '#3B82F6',
              colorBackground:         '#0d1424',
              colorInputBackground:    '#1a2235',
              colorInputText:          '#F1F5F9',
              colorText:               '#F1F5F9',
              colorTextSecondary:      '#94A3B8',
              colorNeutral:            '#94A3B8',
              colorTextOnPrimaryBackground: '#ffffff',
              borderRadius:            '12px',
              fontFamily:              'inherit',
            },
            elements: {
              card:                   'shadow-2xl shadow-blue-500/10 border border-white/8',
              cardBox:                'shadow-none',

              headerTitle:            'text-white',
              headerSubtitle:         'text-slate-400',

              formFieldLabel:         'text-slate-300 font-medium',
              formFieldLabelRow:      'text-slate-300',

              formFieldInput:         'bg-[#1a2235] border-white/10 text-slate-100 placeholder:text-slate-600 focus:border-blue-500/60 focus:bg-[#1e2a40]',
              formFieldInputShowPasswordButton: 'text-slate-400 hover:text-slate-200',

              formFieldHintText:      'text-slate-500',
              formFieldErrorText:     'text-red-400',

              dividerLine:            'bg-white/10',
              dividerText:            'text-slate-500',

              socialButtonsBlockButton:       'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
              socialButtonsBlockButtonText:   'text-slate-300 font-medium',
              socialButtonsBlockButtonArrow:  'text-slate-500',

              formButtonPrimary:      'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20',

              footerActionText:       'text-slate-400',
              footerActionLink:       'text-blue-400 hover:text-blue-300 font-semibold',
              footer:                 'bg-transparent',

              formFieldAction:        'text-blue-400 hover:text-blue-300',
              identityPreviewText:    'text-slate-300',
              identityPreviewEditButton: 'text-blue-400 hover:text-blue-300',

              alertText:              'text-slate-300',
              alertTextDanger:        'text-red-400',
            }
          }}
        />
      </div>
    </div>
  )
}