import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 5200,
      proxy: {
        '/api': {
          target: 'http://localhost:9090',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/heloc-application-service/0.0')
        },
        '/appraisal-api': {
          target: 'http://localhost:9095',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/appraisal-api/, '/heloc-avm-service/0.0')
        },
        '/portfolio-api': {
          target: 'http://localhost:9097',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/portfolio-api/, '/heloc-dashboard-service/0.0')
        },
        '/esign-api': {
          target: 'http://localhost:9098',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/esign-api/, '/heloc-communication-service/0.0')
        },
        '/ofac-api': {
          target: 'http://localhost:9096',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ofac-api/, '/heloc-openbanking-service/0.0')
        },
        '/preapproval-api': {
          target: 'http://localhost:9099',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/preapproval-api/, '/heloc-pipeline-service/0.0')
        },
                '/lien-api': {
                  target: 'http://localhost:9094',
                  changeOrigin: true,
                  rewrite: (path) => path.replace(/^\/lien-api/, '/heloc-document-service/0.0')
        },
        '/credit-api': {
          target: 'http://localhost:9091',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/credit-api/, '/heloc-credit-service/0.0')
        },
        '/underwriting-api': {
          target: 'http://localhost:9093',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/underwriting-api/, '/heloc-profile-service/0.0')
        },
                '/booking-api': {
                  target: 'http://localhost:9094',
                  changeOrigin: true,
                  rewrite: (path) => path.replace(/^\/booking-api/, '/heloc-document-service/0.0')
        },
      }
    }
  }
})
