import { spawnSync } from 'node:child_process';
import * as os from "node:os";
import * as process from "node:process";

console.log(process.env);

// --- Constants ---------------------------------------------------------------
const CHECKSUM_FILE = "checksums-sha512.txt";
const REPOSITORY = "chains-project/ghasum";

// --- Context -----------------------------------------------------------------
const OS = os.platform().toLowerCase(); // TODO
const ARCH = os.arch().toLowerCase(); // TODO

const WORKFLOW = ""; // TODO
const JOB = ""; // TODO

let TMP;
switch (`${OS}-${ARCH}`) {
case "linux-arm64":   TMP = "ghasum_linux_arm64.tar.gz";  break;
case "linux-x64":     TMP = "ghasum_linux_amd64.tar.gz";  break;
case "macos-arm64":   TMP = "ghasum_darwin_arm64.tar.gz"; break;
case "macos-x64":     TMP = "ghasum_darwin_amd64.tar.gz"; break;
case "windows-arm64": TMP = "ghasum_windows_arm64.zip";   break;
case "windows-x64":   TMP = "ghasum_windows_amd64.zip";   break;
}

// --- Inputs ------------------------------------------------------------------
const VERSION = "v0.6.3"; // TODO
const CHECKSUM = "sha256:ea8d55ff6d1a0a733a499f52594e25841038e65de1f45986cb0eea3ecd011c34".replace(/^sha256:/, ""); // TODO

// --- Script ------------------------------------------------------------------
try {
  const cwd = "/tmp/ghasum";

  spawnSync("mkdir", ["-p", cwd]);
  spawnSync("gh", ["release", "download", VERSION, "--repo", REPOSITORY, "--pattern", CHECKSUM_FILE], { cwd });
  spawnSync("shasum", ["-a", "256", "-c", "-"], { cwd, input: `${CHECKSUM}  ${CHECKSUM_FILE}` });
  spawnSync("gh", ["release", "download", VERSION, "--repo", REPOSITORY, "--pattern", TMP], { cwd });
  spawnSync("shasum", ["--check", "--ignore-missing", CHECKSUM_FILE], { cwd });
  spawnSync("tar", ["-xf", TMP], { cwd });
  spawnSync("./ghasum"["verify", "-cache", "/home/runner/work/_actions", "-no-evict", "-offline", `${WORKFLOW}:${JOB}`], { cwd });

  // TODO: expose
} catch {
  switch (OS) {
  case "linux":
    spawnSync("rm", ["-rf", "/home/runner/work/_actions"]);
    break;
  case "macos":
    spawnSync("rm", ["-rf", "/Users/runner/work/_actions"]);
    break;
  case "windows":
    spawnSync("rm", ["-rf", "C:\\a\\_actions", "D:\\a\\_actions"]);
    break;
  }
}
