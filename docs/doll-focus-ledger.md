# Forty doll-focused passes

Base: `5b02f9a0b31b7aa1324d080fd29e4f240b1c03ac`. D01–D40 follow the previous forty refinements.

Each pass has a concrete regression, observed RED/GREEN results and its own local commit; the GitHub PR receives four grouped checkpoints. Rendered reviews occur at checkpoints, not as forty separate device tests.

| Pass | Refinement | Local commit | Cumulative art checks |
|---|---|---|---|
| D01 | Cheek and jaw sculpt | `fbac4f9` | 42 |
| D02 | Painted porcelain complexion | `f3fedad` | 43 |
| D03 | Almond eye sockets | `bfc3cc7` | 44 |
| D04 | Individual glass irises | `2d57291` | 45 |
| D05 | Lid rims and lashes | `5a00ac9` | 46 |
| D06 | Actual closed eyelids | `b69284f` | 47 |
| D07 | Sculpted lips | `1b47a20` | 48 |
| D08 | Soft nose bridge | `b1ced3d` | 49 |
| D09 | Recessed ears | `3532ae7` | 50 |
| D10 | Bisque finish and neck joint | `a32e75e` | 51 |
| D11 | Swept hair cap | `89980e2` | 52 |
| D12 | Lina plaits | `a0389b6` | 53 |
| D13 | Noor braided bun | `5fbb982` | 54 |
| D14 | Sami side part | `bccdeac` | 55 |
| D15 | Fabric ribbon folds | `733e20a` | 56 |
| D16 | Lina embroidered apron | `9988ccf` | 57 |
| D17 | Noor moon pinafore | `5ab1f02` | 58 |
| D18 | Sami tailored dungarees | `ad32463` | 59 |
| D19 | Character-specific shoes | `6841e8a` | 60 |
| D20 | Knitted socks | `91fbdaa` | 61 |

All rows have retained failing and passing assertion logs and a fresh unit/build log. The commit IDs identify the exportable local Git bundle; the remote PR receives grouped checkpoint commits. Final rendered results are recorded separately after executing CI.
