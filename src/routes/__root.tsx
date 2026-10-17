import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { SiteplaneUIProvider } from '@/siteplane/system/provider/siteplane-ui-provider'
import '@fontsource-variable/inter'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Kulakan - Cek Harga Pasar Trenggalek Hari Ini | kulakan.nggalek.co',
      },
      {
        name: 'description',
        content: 'Cek dan bandingkan harga kebutuhan pokok harian di pasar-pasar se-Trenggalek. Cari pasar termurah dan hitung belanjaan Anda dengan mudah di kulakan.nggalek.co.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="light">
      <head>
        <HeadContent />
      </head>
      <body>
        <SiteplaneUIProvider data-theme="light">
          {children}
        </SiteplaneUIProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
