import forms from '@tailwindcss/forms'
import containerQueries from '@tailwindcss/container-queries'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'error-container':'#93000a','on-tertiary-fixed-variant':'#44474d','on-error-container':'#ffdad6','tertiary-fixed-dim':'#c4c6ce','on-secondary-fixed':'#002109','tertiary-fixed':'#e1e2ea','on-tertiary':'#2d3037','on-tertiary-container':'#52555c','on-secondary':'#003914','on-error':'#690005',error:'#ffb4ab','on-primary-fixed':'#241a00','secondary-container':'#00d25e','secondary-fixed':'#67ff8c','surface-container-low':'#1a1c20','surface-container':'#1e2024','secondary-fixed-dim':'#2ee36d','on-primary':'#3d2f00','inverse-primary':'#745b00','on-surface':'#e2e2e8','primary-container':'#f5c518','tertiary-container':'#c9cad2',surface:'#111317','surface-dim':'#111317','surface-bright':'#37393e','inverse-surface':'#e2e2e8','on-secondary-fixed-variant':'#005321','on-primary-fixed-variant':'#584400','surface-container-high':'#282a2e','on-surface-variant':'#d1c5ac','surface-tint':'#f0c110','surface-variant':'#333539','outline-variant':'#4e4633',outline:'#9a9078','primary-fixed':'#ffe08b',primary:'#ffe5a0','on-background':'#e2e2e8','on-primary-container':'#695200',background:'#111317','on-secondary-container':'#005321',tertiary:'#e5e6ef','surface-container-lowest':'#0c0e12','primary-fixed-dim':'#f0c110',secondary:'#40ef77','surface-container-highest':'#333539','inverse-on-surface':'#2f3035','on-tertiary-fixed':'#191c22',
      },
      borderRadius:{DEFAULT:'0.125rem',lg:'0.25rem',xl:'0.5rem',full:'0.75rem'},
      spacing:{'stack-md':'16px','stack-lg':'32px','container-max':'1280px',unit:'4px',gutter:'24px','stack-sm':'8px','margin-mobile':'16px','margin-desktop':'40px'},
      fontFamily:{'body-lg':['Inter'],'rating-num':['Inter'],'headline-md':['Inter'],'display-lg-mobile':['Inter'],'display-lg':['Inter'],'body-sm':['Inter'],'label-caps':['JetBrains Mono'],'body-md':['Inter'],'headline-sm':['Inter']},
      fontSize:{'body-lg':['18px',{lineHeight:'28px',fontWeight:'400'}],'rating-num':['18px',{lineHeight:'24px',fontWeight:'700'}],'headline-md':['24px',{lineHeight:'32px',fontWeight:'700'}],'display-lg-mobile':['32px',{lineHeight:'40px',letterSpacing:'-0.02em',fontWeight:'800'}],'display-lg':['48px',{lineHeight:'56px',letterSpacing:'-0.02em',fontWeight:'800'}],'body-sm':['14px',{lineHeight:'20px',fontWeight:'400'}],'label-caps':['12px',{lineHeight:'16px',letterSpacing:'0.1em',fontWeight:'600'}],'body-md':['16px',{lineHeight:'24px',fontWeight:'400'}],'headline-sm':['20px',{lineHeight:'28px',fontWeight:'600'}]},
    },
  },
  plugins: [forms, containerQueries],
}

