#!/usr/bin/env bash
# Only builds a temporary, independently restorable owner archive. NEVER DELETES ANYTHING.
set -Eeuo pipefail
umask 077
repo="Salmanzadeh-ir/moulla"
work="$RUNNER_TEMP/pmm-owner-backup-$GITHUB_RUN_ID"
stage="$work/PayeMenbareMola-BACKUP-v119"
mkdir -p "$stage/metadata" "$stage/github-releases" "$work/delivery"
command -v gh >/dev/null
command -v jq >/dev/null
command -v zip >/dev/null
command -v unzip >/dev/null
command -v git >/dev/null
echo "Creating mirror of ALL Git branches and tags without modifying repository..."
git -c protocol.version=2 clone --mirror "https://github.com/$repo.git" "$work/repository.git"
git --git-dir="$work/repository.git" fsck --full --no-reflogs
git --git-dir="$work/repository.git" for-each-ref --format='%(refname) %(objectname) %(objecttype)' | LC_ALL=C sort > "$stage/metadata/ALL-GIT-REFS.txt"
test -s "$stage/metadata/ALL-GIT-REFS.txt"
git --git-dir="$work/repository.git" bundle create "$stage/ALL-BRANCHES-TAGS-COMMITS.bundle" --all
git --git-dir="$work/repository.git" bundle verify "$stage/ALL-BRANCHES-TAGS-COMMITS.bundle"
test -s "$stage/ALL-BRANCHES-TAGS-COMMITS.bundle"
echo "Create ZIP of the EXACT active main source for simple phone access"
git --git-dir="$work/repository.git" archive --format=zip --output="$stage/ACTIVE-main-SOURCE.zip" refs/heads/main
unzip -tq "$stage/ACTIVE-main-SOURCE.zip"
echo "Retrieve all historical GitHub Releases and ALL release assets..."
gh api "/repos/$repo/releases?per_page=100" > "$stage/metadata/ALL-RELEASES.json"
gh api "/repos/$repo/branches?per_page=100" > "$stage/metadata/ALL-BRANCHES.json"
gh api "/repos/$repo/git/matching-refs/tags/" > "$stage/metadata/ALL-TAGS.json"
jq -e 'type == "array" and length < 100 and length >= 5' "$stage/metadata/ALL-RELEASES.json" >/dev/null
jq -e 'type == "array" and length < 100 and length >= 50' "$stage/metadata/ALL-BRANCHES.json" >/dev/null
jq -e 'type == "array" and length >= 6' "$stage/metadata/ALL-TAGS.json" >/dev/null
jq -r '.[] | select((.assets | length) > 0) | .tag_name' "$stage/metadata/ALL-RELEASES.json" | while IFS= read -r tag; do
  test -n "$tag"
  mkdir -p "$stage/github-releases/$tag"
  gh release download "$tag" -R "$repo" --dir "$stage/github-releases/$tag" --clobber
done
jq -r '.[] | .tag_name as $tag | .assets[] | [$tag, .name, .size] | @tsv' "$stage/metadata/ALL-RELEASES.json" |
while IFS="$(printf '\t')" read -r tag asset expected_size; do
  f="$stage/github-releases/$tag/$asset"
  test -f "$f"
  actual_size="$(stat -c '%s' "$f")"
  if test "$actual_size" != "$expected_size"; then echo "ERROR: Release asset size mismatch: $tag/$asset" >&2; exit 20; fi
done
echo "Checking complete git restore FROM THE BUNDLE, independent of remote..."
git -c protocol.version=2 clone --mirror "$stage/ALL-BRANCHES-TAGS-COMMITS.bundle" "$work/restored.git"
git --git-dir="$work/restored.git" fsck --full --no-reflogs
git --git-dir="$work/restored.git" for-each-ref --format='%(refname) %(objectname) %(objecttype)' | LC_ALL=C sort > "$work/RESTORED-GIT-REFS.txt"
diff -u "$stage/metadata/ALL-GIT-REFS.txt" "$work/RESTORED-GIT-REFS.txt"
git --git-dir="$work/restored.git" cat-file -e refs/heads/main^{commit}
echo "Verify approved active 182 Git objects and v119 policy from restored backup..."
restored_head="$(git --git-dir="$work/restored.git" rev-parse refs/heads/main)"
main_expected="$(git --git-dir="$work/repository.git" rev-parse refs/heads/main)"
test "$restored_head" = "$main_expected"
printf '%s\n' "$restored_head" > "$stage/metadata/MAIN-COMMIT.txt"
git --git-dir="$work/restored.git" show refs/heads/main:design/owner-active-version.json |
  jq -e '.active_branch=="main" and .active_version=="v119" and .active_app_files==182 and .cleanup_authorized==false' >/dev/null
git --git-dir="$work/restored.git" ls-tree -r --name-only refs/heads/main -- app/ | wc -l | grep -qx '182'
{
  echo "پشتیبان پروژه پای منبر مولا — برای نگهداری مستقل روی گوشی"
  echo "This is an owner backup, NOT a new Android app or official release."
  echo ""
  echo "Created from all current Git refs: branches, tags, complete reachable commit history."
  echo "The .bundle contains all Git-tracked APK files from download branches, snapshots and prior commits."
  echo "github-releases/ contains separately downloaded GitHub Release assets."
  echo "ACTIVE-main-SOURCE.zip is for viewing the current approved v119 source without Git."
  echo "metadata/ALL-GIT-REFS.txt contains EVERY Git ref and exact object SHA."
  echo "metadata/*json list branches, tags, and release asset metadata."
  echo "CHECKSUMS-SHA256.txt lists the real SHA256 of every backup member file."
  echo ""
  echo "For recovery on a computer with Git, unzip this package and run:"
  echo "  git clone --mirror ALL-BRANCHES-TAGS-COMMITS.bundle recovered-moulla.git"
  echo "SHA comparison: sha256sum -c CHECKSUMS-SHA256.txt (run inside extracted folder)."
  echo "Git mirror recovery and exact ref comparison were tested independently during this build."
  echo "Keep this archive on phone or a USB drive, outside the original GitHub repository."
  echo "No GitHub branch, tag, release, APK or other file was deleted."
} > "$stage/README-BACKUP.txt"
echo "Compute per-file SHA256 hashes..."
(cd "$stage" && find . -type f ! -name CHECKSUMS-SHA256.txt -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS-SHA256.txt && sha256sum -c CHECKSUMS-SHA256.txt)
nbranches="$(jq 'length' "$stage/metadata/ALL-BRANCHES.json")"
ntags="$(jq 'length' "$stage/metadata/ALL-TAGS.json")"
nreleases="$(jq 'length' "$stage/metadata/ALL-RELEASES.json")"
nassets="$(jq '[.[].assets | length] | add' "$stage/metadata/ALL-RELEASES.json")"
{
echo "MAIN_SHA=$restored_head"
echo "BRANCHES=$nbranches"
echo "TAGS=$ntags"
echo "RELEASES=$nreleases"
echo "RELEASE_ASSETS=$nassets"
echo "GIT_REF_COUNT=$(wc -l < "$stage/metadata/ALL-GIT-REFS.txt")"
echo "BUNDLE_BYTES=$(stat -c '%s' "$stage/ALL-BRANCHES-TAGS-COMMITS.bundle")"
echo "RESTORE_TEST=SUCCESS"
echo "ALL_RELEASE_ASSET_SIZES=PASS"
echo "INTERNAL_SHA256_MANIFEST=PASS"
echo "DELETIONS_PERFORMED=0"
} > "$stage/metadata/VERIFICATION-SUMMARY.txt"
# Refresh checksums including the verification summary, which is produced last.
(cd "$stage" && find . -type f ! -name CHECKSUMS-SHA256.txt -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > CHECKSUMS-SHA256.txt && sha256sum -c CHECKSUMS-SHA256.txt)
zipname="PayeMenbareMola-COMPLETE-OWNER-BACKUP-$GITHUB_RUN_ID.zip"
echo "Create phone-download ZIP with all files and portable checksum..."
(cd "$work" && zip -q -0 -r "delivery/$zipname" "PayeMenbareMola-BACKUP-v119")
unzip -tq "$work/delivery/$zipname"
(cd "$work/delivery" && sha256sum "$zipname" > SHA256SUMS.txt && sha256sum -c SHA256SUMS.txt)
echo "Verify recovery AGAIN from ZIP bytes, as downloaded by the owner..."
mkdir -p "$work/extracted"
unzip -q "$work/delivery/$zipname" -d "$work/extracted"
unzipbase="$work/extracted/PayeMenbareMola-BACKUP-v119"
(cd "$unzipbase" && sha256sum -c CHECKSUMS-SHA256.txt)
git clone --mirror "$unzipbase/ALL-BRANCHES-TAGS-COMMITS.bundle" "$work/extracted-restore.git"
git --git-dir="$work/extracted-restore.git" fsck --full --no-reflogs
git --git-dir="$work/extracted-restore.git" for-each-ref --format='%(refname) %(objectname) %(objecttype)' | LC_ALL=C sort > "$work/EXTRACTED-RESTORED-GIT-REFS.txt"
cmp "$stage/metadata/ALL-GIT-REFS.txt" "$work/EXTRACTED-RESTORED-GIT-REFS.txt"
{
echo "SUCCESS: OWNER FULL BACKUP ZIP"
cat "$stage/metadata/VERIFICATION-SUMMARY.txt"
echo "ZIP_FILE=$zipname"
echo "ZIP_BYTES=$(stat -c '%s' "$work/delivery/$zipname")"
cat "$work/delivery/SHA256SUMS.txt"
} | tee "$work/delivery/BACKUP-VERIFIED.txt"
cp "$stage/metadata/VERIFICATION-SUMMARY.txt" "$work/delivery/SOURCE-VERIFICATION-SUMMARY.txt"
cp "$stage/README-BACKUP.txt" "$work/delivery/README-FA.txt"
cp "$stage/metadata/ALL-BRANCHES.json" "$work/delivery/BRANCHES-METADATA.json"
cp "$stage/metadata/ALL-TAGS.json" "$work/delivery/TAGS-METADATA.json"
echo "All done. NO DELETE. Artifact files:"
ls -lh "$work/delivery"
echo "PMM_BACKUP_DELIVERY=$work/delivery" >> "$GITHUB_ENV"
