from voice_backend.server import RunnerArgumentParser


def make_parser() -> RunnerArgumentParser:
    parser = RunnerArgumentParser(default_overrides={"port": 8080, "ws_auth": "token"})
    # Declared the way pipecat.runner.run.main() declares them: with explicit defaults.
    parser.add_argument("--port", type=int, default=7860)
    parser.add_argument("--ws-auth", dest="ws_auth", choices=["none", "token"], default="none")
    parser.add_argument("--host", default="localhost")
    return parser


def test_overrides_the_runner_defaults() -> None:
    args = make_parser().parse_args([])

    assert args.port == 8080
    assert args.ws_auth == "token"
    assert args.host == "localhost"


def test_explicit_flags_still_win() -> None:
    args = make_parser().parse_args(["--port", "9000", "--ws-auth", "none"])

    assert args.port == 9000
    assert args.ws_auth == "none"
