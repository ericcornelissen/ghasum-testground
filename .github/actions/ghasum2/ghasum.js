import { spawnSync } from 'node:child_process';
import * as os from "node:os";
import * as process from "node:process";

// --- Constants ---------------------------------------------------------------
const CHECKSUM_FILE = "checksums-sha512.txt";
const REPOSITORY = "chains-project/ghasum";

// --- Context -----------------------------------------------------------------
const OS = os.platform().toLowerCase();
const ARCH = os.arch().toLowerCase();

const WORKFLOW = process.env.GITHUB_WORKFLOW_REF;
const JOB = process.env.GITHUB_JOB;

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
const CHECKSUM = process.env.INPUT_CHECKSUM.replace(/^sha256:/, "");
const MODE = process.env.INPUT_MODE;
const VERSION = process.env.INPUT_VERSION;

// --- Script ------------------------------------------------------------------
try {
	if (MODE !== "install" && MODE !== "verify") {
		throw new Error(`mode must be 'install' or 'verify', got: ${MODE}`);
	}

	const cwd = "/tmp/ghasum";
	exec(["mkdir", "-p", cwd]);
	exec(["gh", "release", "download", VERSION, "--repo", REPOSITORY, "--pattern", CHECKSUM_FILE], { cwd });
	exec(["shasum", "-a", "256", "-c", "-"], { cwd, input: `${CHECKSUM}  ${CHECKSUM_FILE}` });
	exec(["gh", "release", "download", VERSION, "--repo", REPOSITORY, "--pattern", TMP], { cwd });
	exec(["shasum", "--check", "--ignore-missing", CHECKSUM_FILE], { cwd });
	exec(["tar", "-xf", TMP], { cwd });

	if (MODE === "verify") {
		exec(["./ghasum", "verify", "-cache", "/home/runner/work/_actions", "-no-evict", "-offline", `${WORKFLOW}:${JOB}`], { cwd });
	}

	// TODO: expose
} catch (error) {
	console.error(error);
	nuke();
}

// --- Functions ---------------------------------------------------------------
function exec(cmd, opts) {
	console.info(cmd.join(" "));
	spawnSync(cmd[0], cmd.slice(1, cmd.length), opts);
}

function nuke() {
	switch (OS) {
	case "linux":
		exec(["rm", "-rf", "/home/runner/work/_actions"]);
		break;
	case "macos":
		exec(["rm", "-rf", "/Users/runner/work/_actions"]);
		break;
	case "windows":
		exec(["rm", "-rf", "C:\\a\\_actions", "D:\\a\\_actions"]);
		break;
	}
}
