# cyber-orchestrator

An **educational, authorization-gated reconnaissance orchestrator**.

It demonstrates the real structure of a security-assessment pipeline —
*recon → scan → report* — while making it **impossible to run against a target
you have not explicitly declared you are authorized to test**. It performs only
non-destructive observation (DNS lookups, TCP-connect port checks, a single HTTP
request). There is no exploitation, brute-forcing, denial-of-service, or
evasion code here, by design.

> ⚠️ **Use only on systems you own or are explicitly authorized to test.**
> Unauthorized scanning of computers you do not own is illegal in most
> jurisdictions. This project is meant for home labs, CTFs, and authorized
> engagements.

## How the safety gate works

Nothing runs until you provide an `authorization.yaml` that:

1. names the operator and engagement,
2. sets `i_am_authorized: true` (an explicit attestation), and
3. lists a **scope** whitelist of hosts/CIDRs.

Every target is checked against that scope before any module touches it.
By default only loopback / private / link-local addresses are permitted, so a
first run can never reach the public internet. Out-of-scope targets are skipped
and recorded, never scanned.

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp authorization.example.yaml authorization.yaml
# edit authorization.yaml: set i_am_authorized: true and your scope

# scan a target that is inside your declared scope
python -m orchestrator 127.0.0.1 -v
```

## Usage

```bash
python -m orchestrator [targets...] [options]

  -a, --auth PATH        authorization file (default: authorization.yaml)
  -m, --modules LIST     comma-separated modules to run
  -f, --format {text,json}
  -o, --output PATH      write the report to a file
      --list-modules     list available modules
  -v, --verbose
```

## Built-in modules

| module             | what it does (non-destructive)                         |
|--------------------|--------------------------------------------------------|
| `dns_recon`        | forward + reverse DNS resolution                       |
| `port_scan`        | TCP-connect scan of common ports (ordinary handshakes) |
| `http_fingerprint` | single GET request; records status, headers, title     |

Add your own by subclassing `orchestrator.modules.base.Module` and registering
it in `orchestrator/modules/__init__.py`.

## Architecture

```
orchestrator/
  authorization.py   # the safety gate (default-deny, scope whitelist)
  engine.py          # runs modules per authorized target -> RunReport
  reporting.py       # RunReport -> text / JSON
  cli.py             # command-line interface
  modules/
    base.py          # Module base class + ModuleResult
    recon_dns.py
    port_scan.py
    http_fingerprint.py
```

## Tests

```bash
pip install pytest
python -m pytest -q
```

## License

MIT
