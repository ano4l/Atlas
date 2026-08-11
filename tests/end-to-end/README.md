# End-to-end backend flow

`run-map-package-flow.ps1` exercises the first real platform milestone:

1. Start local PostGIS.
2. Generate the deterministic two-floor venue package.
3. Start `platform-api`.
4. Import the package transactionally.
5. Publish the imported map version.
6. Search for Zara.
7. Request and verify a two-floor route.

Run from the repository root:

```powershell
.\tests\end-to-end\run-map-package-flow.ps1
```

Use `-KeepApiRunning` to leave the API process alive after the check. The script never removes the PostGIS volume.
