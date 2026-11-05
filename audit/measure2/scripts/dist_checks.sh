#!/usr/bin/env bash
# Part D/A: dist listing, absence of root-level static files, secret grep, dep-usage check.
source ~/dev/env.sh >/dev/null 2>&1
R=~/dev/audit-levetid/measure2/repo
W=~/dev/audit-levetid/measure2/work/health
cd "$R" || exit 1

{
echo '## git ls-files at repo root (static candidates)'
git ls-files | grep -E '^[^/]+$' | grep -Ev '^(package|eslint|vite|postcss)' | sort
echo
echo '## public/ (what Vite copies to dist as-is)'
ls -la public
echo
echo '## dist/ top level (local build)'
ls -la dist | sed -E 's/^[^ ]+ +[0-9]+ [^ ]+ [^ ]+ +//'
echo
for f in sitemap.xml robots.txt ads.txt privatlivspolitik.html cookiepolitik.html; do
  if [ -e "dist/$f" ]; then echo "dist/$f: PRESENT"; else echo "dist/$f: ABSENT"; fi
done
echo
echo '## dist/ recursive file count and source maps'
find dist -type f | wc -l
find dist -type f -name '*.map' | wc -l
echo
echo '## sourceMappingURL comments in shipped JS'
grep -l 'sourceMappingURL' dist/assets/*.js dist/sw.js dist/workbox-*.js 2>/dev/null | wc -l
} > "$W/dist-listing.txt" 2>&1

# Secret-looking strings: scan dist (incl. maps) and the repo src/index.html. Print only file, pattern and match, with value masked past 6 chars.
{
echo '## secret-pattern scan'
PAT='(api[_-]?key|apikey|secret|passwd|password|bearer|authorization|x-api-key|client[_-]?secret|private[_-]?key|BEGIN (RSA|EC|OPENSSH|PRIVATE)|AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|xox[baprs]-|pub-[0-9]{10,}|AKIA[0-9A-Z]{16})'
echo "-- dist (excluding .map)"
grep -RIoiE "$PAT" dist --include='*.js' --include='*.css' --include='*.html' --include='*.webmanifest' 2>/dev/null | sort | uniq -c | sort -rn | head -40
echo "-- dist .map files (sourcesContent includes node_modules sources)"
grep -RIoiE "$PAT" dist --include='*.map' 2>/dev/null | sed -E 's/^dist\/assets\/([^:]+):/\1: /' | awk '{c[$0]++} END{for(k in c) print c[k], k}' | sort -rn | head -40
echo "-- repo root + src + public (excluding node_modules, dist, backup, package-lock)"
grep -RInoiE "$PAT" index.html src public vite.config.js Dockerfile nixpacks.toml .dokploy ads.txt robots.txt sitemap.xml README.md WARP.md CLAUDE.md .github 2>/dev/null | head -40
echo "-- hard-coded external URLs in src+index.html"
grep -RInoE "https?://[A-Za-z0-9._~:/?#@!$&*+,;=%-]+" src index.html 2>/dev/null | grep -v 'schema.org\|w3.org\|github.com/advisories' | awk -F: '{print $3":"$4}' | sort | uniq -c | sort -rn | head -50
} > "$W/secret-scan.txt" 2>&1

# Dependency usage
{
echo '## package.json dependencies imported in src/ or config'
for d in $(node -p 'Object.keys(require("./package.json").dependencies).join(" ")'); do
  n=$(grep -RIlE "from ['\"]$d(/[^'\"]*)?['\"]|require\(['\"]$d" src index.html vite.config.js 2>/dev/null | wc -l)
  echo "dep $d: imported in $n file(s)"
done
echo '## devDependencies referenced anywhere (src, configs, scripts)'
for d in $(node -p 'Object.keys(require("./package.json").devDependencies).join(" ")'); do
  n=$(grep -RIlF "$d" src eslint.config.js vite.config.js postcss.config.js package.json .prettierrc .github 2>/dev/null | grep -v '^package.json$' | wc -l)
  s=$(grep -cF "$d" package.json)
  echo "devDep $d: referenced outside package.json in $n file(s)"
done
echo '## html-to-image usage'
grep -RIn "html-to-image" src | head
echo '## lucide-react usage count (files)'
grep -RIl "lucide-react" src | wc -l
} > "$W/dep-usage.txt" 2>&1
echo ok
