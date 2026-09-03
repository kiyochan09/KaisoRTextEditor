import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { defineConfig, Plugin } from 'vite';

const execAsync = promisify(exec);

function gitApiPlugin(): Plugin {
  return {
    name: 'git-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        if (url === '/api/git/status' && req.method === 'GET') {
          try {
            const { stdout: statusOut } = await execAsync('git status -s', { cwd: __dirname });
            const { stdout: branchOut } = await execAsync('git branch --show-current', { cwd: __dirname });
            const { stdout: remoteOut } = await execAsync('git remote get-url origin', { cwd: __dirname });
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              branch: branchOut.trim() || 'main',
              remote: remoteOut.trim() || 'https://github.com/kiyochan09/KaisoRTextEditor.git',
              changes: statusOut.trim() ? statusOut.trim().split('\n') : [],
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url === '/api/git/push' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              let parsed: any = {};
              try { parsed = JSON.parse(body); } catch(e) {}
              const commitMessage = parsed.commitMessage?.trim() || `Update: KaisoRTextEditor ${new Date().toLocaleString()}`;

              // 1. git add -A
              await execAsync('git add -A', { cwd: __dirname });
              
              // 2. git commit (if there are changes)
              let commitOutput = '';
              try {
                const { stdout: cOut } = await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: __dirname });
                commitOutput = cOut;
              } catch (commitErr: any) {
                commitOutput = commitErr.stdout || commitErr.message;
              }

              // 3. git push origin main
              const { stdout: pushOut, stderr: pushErr } = await execAsync('git push origin main', { cwd: __dirname });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                message: 'GitHubへのプッシュが正常に完了しました！',
                commitOutput,
                pushOutput: pushOut || pushErr,
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: err.message,
                stderr: err.stderr,
                stdout: err.stdout
              }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gitApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3001,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
