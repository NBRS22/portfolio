"""Agent registry.

Built-in agents live in :mod:`voice_backend.agents.catalog`, one module per agent, and are
discovered automatically: adding an agent means adding a file with a ``@register_agent`` class.
Agents outside this package are loaded with an import path, ``package.module:ClassName``.
"""

import importlib
import pkgutil
from collections.abc import Callable

from voice_backend.agents.base import VoiceAgent

CATALOG_PACKAGE = "voice_backend.agents.catalog"

_registry: dict[str, type[VoiceAgent]] = {}
_catalog_loaded = False


class UnknownAgentError(LookupError):
    """Raised when an agent name or import path cannot be resolved."""


def register_agent[AgentT: type[VoiceAgent]](name: str) -> Callable[[AgentT], AgentT]:
    """Class decorator registering a :class:`VoiceAgent` subclass under ``name``.

    The first line of the class docstring becomes the agent's description.
    """

    def decorator(cls: AgentT) -> AgentT:
        if not (isinstance(cls, type) and issubclass(cls, VoiceAgent)):
            raise TypeError(f"{cls!r} is not a VoiceAgent subclass")
        existing = _registry.get(name)
        if existing is not None and existing is not cls:
            raise ValueError(f"Agent name {name!r} is already used by {existing.__qualname__}")
        cls.name = name
        cls.description = _first_line(cls.__doc__)
        _registry[name] = cls
        return cls

    return decorator


def available_agents() -> dict[str, str]:
    """Return ``{name: description}`` for every built-in agent."""
    _load_catalog()
    return {name: cls.description for name, cls in sorted(_registry.items())}


def resolve_agent(spec: str) -> type[VoiceAgent]:
    """Return the agent class for a registered name or a ``package.module:ClassName`` path."""
    if ":" in spec:
        return _import_agent(spec)
    _load_catalog()
    try:
        return _registry[spec]
    except KeyError:
        names = ", ".join(sorted(_registry)) or "none"
        raise UnknownAgentError(f"Unknown agent {spec!r}. Available agents: {names}") from None


def _import_agent(path: str) -> type[VoiceAgent]:
    module_name, _, attr = path.partition(":")
    try:
        cls = getattr(importlib.import_module(module_name), attr)
    except (ImportError, AttributeError) as error:
        raise UnknownAgentError(f"Cannot import agent {path!r}: {error}") from error
    if not (isinstance(cls, type) and issubclass(cls, VoiceAgent)):
        raise UnknownAgentError(f"{path!r} is not a VoiceAgent subclass")
    if not cls.name:
        cls.name = attr
    return cls


def _first_line(text: str | None) -> str:
    lines = (text or "").strip().splitlines()
    return lines[0].strip() if lines else ""


def _load_catalog() -> None:
    """Import every module of the catalog package so their decorators run."""
    global _catalog_loaded
    if _catalog_loaded:
        return
    catalog = importlib.import_module(CATALOG_PACKAGE)
    for module in pkgutil.iter_modules(catalog.__path__):
        if not module.name.startswith("_"):
            importlib.import_module(f"{CATALOG_PACKAGE}.{module.name}")
    _catalog_loaded = True
