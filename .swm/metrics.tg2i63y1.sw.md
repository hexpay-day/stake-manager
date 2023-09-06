---
id: tg2i63y1
title: metrics
file_version: 1.1.3
app_version: 1.16.4
---

[<img width="200" alt="get in touch with Consensys Diligence" src="https://user-images.githubusercontent.com/2865694/56826101-91dcf380-685b-11e9-937c-af49c2510aa0.png">](https://diligence.consensys.net)<br/>
<sup> \[ [🌐](https://diligence.consensys.net) [📩](mailto:diligence@consensys.net) [🔥](https://consensys.github.io/diligence/) \] </sup><br/>
<br/>

# Solidity Metrics for 'CLI'

## Table of contents

*   Scope (#t-scope)

    *   Source Units in Scope (#t-source-Units-in-Scope)

    *   Out of Scope (#t-out-of-scope)

        *   Excluded Source Units (#t-out-of-scope-excluded-source-units)

        *   Duplicate Source Units (#t-out-of-scope-duplicate-source-units)

        *   Doppelganger Contracts (#t-out-of-scope-doppelganger-contracts)

*   Report Overview (#t-report)

    *   Risk Summary (#t-risk)

    *   Source Lines (#t-source-lines)

    *   Inline Documentation (#t-inline-documentation)

    *   Components (#t-components)

    *   Exposed Functions (#t-exposed-functions)

    *   StateVariables (#t-statevariables)

    *   Capabilities (#t-capabilities)

    *   Dependencies (#t-package-imports)

    *   Totals (#t-totals)

## <span id=t-scope>Scope</span>

This section lists files that are in scope for the metrics report.

*   **Project:** `'CLI'`

*   **Included Files:**

    *   \`\`

*   **Excluded Paths:**

    *   \`\`

*   **File Limit:** `undefined`

    *   **Exclude File list Limit:** `undefined`

*   **Workspace Repository:** `unknown` (`undefined`@`undefined`)

### <span id=t-source-Units-in-Scope>Source Units in Scope</span>

Source Units Analyzed: `23`<br> Source Units in Scope: `23` (**100%**)

<br/>

|Type|File                                       |Logic Contracts|Interfaces|Lines   |nLines  |nSLOC   |Comment Lines|Complex. Score|Capabilities                                                                                                                                                                                            |
|----|-------------------------------------------|---------------|----------|--------|--------|--------|-------------|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|🎨  |./contracts/AuthorizationManager.sol       |1              |\*\*\*\*  |114     |114     |47      |65           |23            |\*\*\*\*                                                                                                                                                                                                |
|📝  |./contracts/Bank.sol                       |1              |\*\*\*\*  |273     |263     |170     |89           |81            |**<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                                                    |
|📝  |./contracts/CurrencyList.sol               |1              |\*\*\*\*  |50      |50      |34      |12           |17            |\*\*\*\*                                                                                                                                                                                                |
|📝  |./contracts/EarningsOracle.sol             |1              |\*\*\*\*  |226     |222     |144     |76           |64            |**<abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                                                                                             |
|🎨  |./contracts/EncodableSettings.sol          |1              |\*\*\*\*  |423     |409     |229     |183          |135           |**<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                                                    |
|📝  |./contracts/ExistingStakeManager.sol       |1              |\*\*\*\*  |7       |7       |3       |2            |3             |\*\*\*\*                                                                                                                                                                                                |
|🎨  |./contracts/GoodAccounting.sol             |1              |\*\*\*\*  |138     |130     |92      |36           |40            |\*\*\*\*                                                                                                                                                                                                |
|📝  |./contracts/HSIStakeManager.sol            |1              |\*\*\*\*  |179     |168     |149     |17           |94            |**<abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                                                                                             |
|📝  |./contracts/IsolatedStakeManager.sol       |1              |\*\*\*\*  |254     |254     |155     |97           |96            |**<abbr title='Payable Functions'>💰</abbr>**                                                                                                                                                           |
|📝  |./contracts/IsolatedStakeManagerFactory.sol|1              |\*\*\*\*  |27      |27      |18      |7            |21            |**<abbr title='Uses Hash-Functions'>🧮</abbr>**                                                                                                                                                         |
|📝  |./contracts/Magnitude.sol                  |1              |\*\*\*\*  |241     |209     |125     |93           |68            |**<abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                                                                                             |
|📝  |./contracts/MaximusStakeManager.sol        |1              |\*\*\*\*  |194     |189     |108     |84           |67            |**<abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                                                                                             |
|📝  |./contracts/MulticallExtension.sol         |1              |\*\*\*\*  |107     |96      |62      |33           |38            |**<abbr title='Uses Assembly'>🖥</abbr><abbr title='DelegateCall'>👥</abbr><abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                    |
|📝  |./contracts/SingletonHedronManager.sol     |1              |\*\*\*\*  |91      |91      |83      |6            |33            |**<abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                                                                                             |
|📝  |./contracts/StakeEnder.sol                 |1              |\*\*\*\*  |242     |238     |205     |31           |70            |**<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                                                    |
|📝  |./contracts/StakeInfo.sol                  |1              |\*\*\*\*  |137     |137     |51      |84           |35            |\*\*\*\*                                                                                                                                                                                                |
|📝  |./contracts/StakeManager.sol               |1              |\*\*\*\*  |9       |9       |6       |1            |6             |\*\*\*\*                                                                                                                                                                                                |
|📝  |./contracts/StakeStarter.sol               |1              |\*\*\*\*  |89      |74      |51      |21           |34            |**<abbr title='Payable Functions'>💰</abbr>**                                                                                                                                                           |
|🎨  |./contracts/Tipper.sol                     |1              |\*\*\*\*  |405     |362     |311     |52           |128           |**<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                                                    |
|📝  |./contracts/TransferrableStakeManager.sol  |1              |\*\*\*\*  |65      |65      |58      |5            |27            |**<abbr title='Payable Functions'>💰</abbr>**                                                                                                                                                           |
|📝  |./contracts/UnderlyingStakeManager.sol     |1              |\*\*\*\*  |191     |184     |115     |67           |56            |**<abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                                                                                             |
|🎨  |./contracts/UnderlyingStakeable.sol        |1              |\*\*\*\*  |139     |122     |55      |75           |40            |**<abbr title='Unchecked Blocks'>Σ</abbr>**                                                                                                                                                             |
|📝  |./contracts/Utils.sol                      |1              |\*\*\*\*  |45      |45      |35      |9            |68            |\*\*\*\*                                                                                                                                                                                                |
|📝🎨|**Totals**                                 |**23**         |\*\*\*\*  |**3646**|**3465**|**2306**|**1145**     |**1244**      |**<abbr title='Uses Assembly'>🖥</abbr><abbr title='Payable Functions'>💰</abbr><abbr title='DelegateCall'>👥</abbr><abbr title='Uses Hash-Functions'>🧮</abbr><abbr title='Unchecked Blocks'>Σ</abbr>**|

<br/>

<sub> Legend: <a onclick="toggleVisibility('table-legend', this)">\[➕\]</a> <div id="table-legend" style="display:none"> <ul> <li> <b>Lines</b>: total lines of the source unit </li> <li> <b>nLines</b>: normalized lines of the source unit (e.g. normalizes functions spanning multiple lines) </li> <li> <b>nSLOC</b>: normalized source lines of code (only source-code lines; no comments, no blank lines) </li> <li> <b>Comment Lines</b>: lines containing single or block comments </li> <li> <b>Complexity Score</b>: a custom complexity score derived from code statements that are known to introduce code complexity (branches, loops, calls, external interfaces, ...) </li> </ul> </div> </sub>

#### <span id=t-out-of-scope>Out of Scope</span>

##### <span id=t-out-of-scope-excluded-source-units>Excluded Source Units</span>

Source Units Excluded: `0`

<a onclick="toggleVisibility('excluded-files', this)">\[➕\]</a>

<div id="excluded-files" style="display:none"> | File | | ------ | | None | </div>

##### <span id=t-out-of-scope-duplicate-source-units>Duplicate Source Units</span>

Duplicate Source Units Excluded: `0`

<a onclick="toggleVisibility('duplicate-files', this)">\[➕\]</a>

<div id="duplicate-files" style="display:none"> | File | | ------ | | None | </div>

##### <span id=t-out-of-scope-doppelganger-contracts>Doppelganger Contracts</span>

Doppelganger Contracts: `0`

<a onclick="toggleVisibility('doppelganger-contracts', this)">\[➕\]</a>

<div id="doppelganger-contracts" style="display:none"> | File | Contract | Doppelganger | | ------ | -------- | ------------ | </div>

## <span id=t-report>Report</span>

### Overview

The analysis finished with `0` errors and `0` duplicate files.

#### <span id=t-risk>Risk</span>

<div class="wrapper" style="max-width: 512px; margin: auto"> <canvas id="chart-risk-summary"></canvas> </div>

#### <span id=t-source-lines>Source Lines (sloc vs. nsloc)</span>

<div class="wrapper" style="max-width: 512px; margin: auto"> <canvas id="chart-nsloc-total"></canvas> </div>

#### <span id=t-inline-documentation>Inline Documentation</span>

*   **Comment-to-Source Ratio:** On average there are`2.16` code lines per comment (lower=better).

*   **ToDo's:** `0`

#### <span id=t-components>Components</span>

<br/>

|📝Contracts|📚Libraries|🔍Interfaces|🎨Abstract|
|-----------|-----------|------------|----------|
|18         |0          |0           |5         |

<br/>

#### <span id=t-exposed-functions>Exposed Functions</span>

This section lists functions that are explicitly declared public or payable. Please note that getter methods for public stateVars are not included.

<br/>

|🌐Public|💰Payable|
|--------|---------|
|99      |18       |

<br/>

|External|Internal|Private|Pure|View|
|--------|--------|-------|----|----|
|99      |177     |0      |42  |50  |

<br/>

#### <span id=t-statevariables>StateVariables</span>

<br/>

|Total|🌐Public|
|-----|--------|
|78   |25      |

<br/>

#### <span id=t-capabilities>Capabilities</span>

<br/>

|Solidity Versions observed|🧪 Experimental Features|💰 Can Receive Funds|🖥 Uses Assembly                        |💣 Has Destroyable Contracts|
|--------------------------|------------------------|--------------------|----------------------------------------|----------------------------|
|`>=0.8.18`                |<br/>                   |`yes`               |`yes`<br><br><br/><br><br>(1 asm blocks)|\*\*\*\*                    |

<br/>

|📤 Transfers ETH|⚡ Low-Level Calls|👥 DelegateCall|🧮 Uses Hash Functions|🔖 ECRecover|🌀 New/Create/Create2|
|----------------|-----------------|---------------|----------------------|------------|---------------------|
|\*\*\*\*        |\*\*\*\*         |`yes`          |`yes`                 |\*\*\*\*    |\*\*\*\*             |

<br/>

|♻️ TryCatch|Σ Unchecked|
|-----------|-----------|
|\*\*\*\*   |`yes`      |

<br/>

#### <span id=t-package-imports>Dependencies / External Imports</span>

<br/>

|Dependency / Import Path                               |Count|
|-------------------------------------------------------|-----|
|@openzeppelin/contracts/access/Ownable2Step.sol        |1    |
|@openzeppelin/contracts/token/ERC20/ERC20.sol          |1    |
|@openzeppelin/contracts/token/ERC20/IERC20.sol         |5    |
|@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol|2    |
|@openzeppelin/contracts/token/ERC721/IERC721.sol       |1    |
|@openzeppelin/contracts/utils/Address.sol              |3    |

<br/>

#### <span id=t-totals>Totals</span>

##### Summary

<div class="wrapper" style="max-width: 90%; margin: auto"> <canvas id="chart-num-bar"></canvas> </div>

##### AST Node Statistics

###### Function Calls

<div class="wrapper" style="max-width: 90%; margin: auto"> <canvas id="chart-num-bar-ast-funccalls"></canvas> </div>

###### Assembly Calls

<div class="wrapper" style="max-width: 90%; margin: auto"> <canvas id="chart-num-bar-ast-asmcalls"></canvas> </div>

###### AST Total

<div class="wrapper" style="max-width: 90%; margin: auto"> <canvas id="chart-num-bar-ast"></canvas> </div>

##### Inheritance Graph

<a onclick="toggleVisibility('surya-inherit', this)">\[➕\]</a>

<div id="surya-inherit" style="display:none"> <div class="wrapper" style="max-width: 512px; margin: auto"> <div id="surya-inheritance" style="text-align: center;"></div> </div> </div>

##### CallGraph

<a onclick="toggleVisibility('surya-call', this)">\[➕\]</a>

<div id="surya-call" style="display:none"> <div class="wrapper" style="max-width: 512px; margin: auto"> <div id="surya-callgraph" style="text-align: center;"></div> </div> </div>

###### Contract Summary

<a onclick="toggleVisibility('surya-mdreport', this)">\[➕\]</a>

<div id="surya-mdreport" style="display:none"> Sūrya's Description Report

Files Description Table

<br/>

|File Name                                  |SHA-1 Hash                              |
|-------------------------------------------|----------------------------------------|
|./contracts/AuthorizationManager.sol       |a8dc212dede252429e74eee0121882c5a852ea7a|
|./contracts/Bank.sol                       |340483cc81a6b429c0ac5628d6ee4501af72d859|
|./contracts/CurrencyList.sol               |39e65aa7b67761740712e753eeb8c564b4a8870c|
|./contracts/EarningsOracle.sol             |71b211a462761ac085df9eae072e7cf6c28dd040|
|./contracts/EncodableSettings.sol          |c93f9e5ccd096e35deaa1ab75fd6403ef4d4eb48|
|./contracts/ExistingStakeManager.sol       |22598533afb3b31b1f25f19b6a004ecd7714c143|
|./contracts/GoodAccounting.sol             |ab772f60ba2a25e012dc3b24b58d63f339869b90|
|./contracts/HSIStakeManager.sol            |08f76f6de05dd1b698bbdaf6074b2ff4a1aa1c35|
|./contracts/IsolatedStakeManager.sol       |66f215ebe1bbcddb637852d2fed7aec3b546f50e|
|./contracts/IsolatedStakeManagerFactory.sol|e273ea4a137a3d45059858b70f91780443a02301|
|./contracts/Magnitude.sol                  |225a15379ec1938b0276474e9c9afc86bdc20205|
|./contracts/MaximusStakeManager.sol        |5944edc34f34df7531cb910368bd84b82ce25af5|
|./contracts/MulticallExtension.sol         |e2db7a46eb0cbcd94d13da5f9656cbe29a85ec93|
|./contracts/SingletonHedronManager.sol     |2ad39540ef54eead5053192a77249882fbf95149|
|./contracts/StakeEnder.sol                 |105737c53b1118bf6c5ac1dabdfde17f884eb32b|
|./contracts/StakeInfo.sol                  |eaa02c41fa02bbcaa3514a25d251a193396ba57d|
|./contracts/StakeManager.sol               |1677faef1eae4b192bf7a48ceebe84a14fd60fd6|
|./contracts/StakeStarter.sol               |7d4a2a122fbfd0a4c9bf08a797df4134a03d269f|
|./contracts/Tipper.sol                     |1494e6e81691fbb7bffe65649aacb34d27de7b72|
|./contracts/TransferrableStakeManager.sol  |010a1dca18fc6f55cde5d7e8c7b42a7b147e9c9c|
|./contracts/UnderlyingStakeManager.sol     |88d7cad07404d6e87f313a69ebe4ed28de641677|
|./contracts/UnderlyingStakeable.sol        |a5efb4ba5afc84d415e362de5f20252865cc7569|
|./contracts/Utils.sol                      |0ab739aeca27ea5c90676c4d15f334f89f5ffb79|

<br/>

Contracts Description Table

<br/>

|Contract                       |Type                          |Bases                                                     |<br/>         |<br/>                                                  |
|-------------------------------|------------------------------|----------------------------------------------------------|--------------|-------------------------------------------------------|
|└                              |**Function Name**             |**Visibility**                                            |**Mutability**|**Modifiers**                                          |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**AuthorizationManager**       |Implementation                |UnderlyingStakeable                                       |<br/>         |<br/>                                                  |
|└                              |<Constructor>                 |Public ❗️                                                 |🛑            |NO❗️                                                   |
|└                              |\_setAuthorization            |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_setAddressAuthorization     |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |isAddressAuthorized           |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_isAddressAuthorized         |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_isAuthorized                |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_getAddressSetting           |Internal 🔒                                               |<br/>         |<br/>                                                  |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**Bank**                       |Implementation                |Utils                                                     |<br/>         |<br/>                                                  |
|└                              |\_getUnattributed             |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_getBalance                  |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |getUnattributed               |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |clamp                         |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_clamp                       |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |depositToken                  |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |depositTokenTo                |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |\_depositTokenTo              |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |collectUnattributed           |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |\_collectUnattributed         |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |collectUnattributedPercent    |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |withdrawTokenTo               |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |\_getTokenBalance             |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_addToTokenWithdrawable      |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_deductWithdrawable          |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_depositTokenFrom            |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |depositTokenUnattributed      |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_withdrawTokenTo             |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_attributeFunds              |Internal 🔒                                               |🛑            |<br/>                                                  |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**CurrencyList**               |Implementation                |Utils                                                     |<br/>         |<br/>                                                  |
|└                              |addCurrencyToList             |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_addCurrencyToList           |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |currencyListSize              |External ❗️                                               |<br/>         |NO❗️                                                   |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**EarningsOracle**             |Implementation                |Utils                                                     |<br/>         |<br/>                                                  |
|└                              |<Constructor>                 |Public ❗️                                                 |🛑            |NO❗️                                                   |
|└                              |totalsCount                   |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |payoutDelta                   |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |payoutDeltaTrucated           |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_storeDay                    |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_readTotals                  |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_saveDay                     |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |storeDay                      |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |incrementDay                  |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_storeDays                   |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |storeDays                     |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |catchUpDays                   |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_validateTotals              |Internal 🔒                                               |<br/>         |<br/>                                                  |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**EncodableSettings**          |Implementation                |StakeInfo                                                 |<br/>         |<br/>                                                  |
|└                              |defaultEncodedSettings        |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |stakeIdSettings               |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |decodeConsentAbilities        |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_decodeConsentAbilities      |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |updateSettings                |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |updateSettingsEncoded         |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |\_updateSettingsEncoded       |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_logPreservedSettingsUpdate  |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_logSettingsUpdate           |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |readEncodedSettings           |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_readEncodedSettings         |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |encodeSettings                |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_encodeSettings              |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |decodeSettings                |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_decodeSettings              |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |encodeConsentAbilities        |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_encodeConsentAbilities      |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_defaultSettings             |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |decrementCopyIterations       |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_decrementCopyIterations     |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |defaultSettings               |External ❗️                                               |<br/>         |NO❗️                                                   |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**ExistingStakeManager**       |Implementation                |MaximusStakeManager                                       |<br/>         |<br/>                                                  |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**GoodAccounting**             |Implementation                |StakeInfo, Tipper                                         |<br/>         |<br/>                                                  |
|└                              |checkStakeGoodAccounting      |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |checkStakeGoodAccountingFor   |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |isGoodAccountable             |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |isStakeIdGoodAccountable      |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_isGoodAccountable           |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_checkStakeGoodAccounting    |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |stakeGoodAccounting           |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_stakeGoodAccounting         |Internal 🔒                                               |🛑            |<br/>                                                  |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**HSIStakeManager**            |Implementation                |StakeEnder                                                |<br/>         |<br/>                                                  |
|└                              |defaultEncodedSettings        |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_defaultSettings             |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |depositHsi                    |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_deposit721                  |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |hsiAddressToId                |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_hsiAddressToId              |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |withdrawHsi                   |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_withdraw721                 |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |hsiStakeEndMany               |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_verifyStakeMatchesIndex     |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_stakeEnd                    |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_stakeStartFor               |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_mintHedron                  |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_checkStakeCustodian         |Internal 🔒                                               |<br/>         |<br/>                                                  |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**IsolatedStakeManager**       |Implementation                |Ownable2Step, AuthorizationManager, GoodAccounting        |<br/>         |<br/>                                                  |
|└                              |<Constructor>                 |Public ❗️                                                 |🛑            |AuthorizationManager                                   |
|└                              |setAuthorization              |External ❗️                                               |🛑            |onlyOwner                                              |
|└                              |setStartAuthorization         |External ❗️                                               |🛑            |onlyOwner                                              |
|└                              |startAuthorizationKey         |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |stakeStart                    |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |stakeStartWithAuthorization   |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |transferFromOwner             |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |stakeEnd                      |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |transferToOwner               |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |checkAndStakeEnd              |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_endStake                    |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_transferToOwner             |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_settingsCheck               |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_startAuthorizationKey       |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_stakeStart                  |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_transferFromOwner           |Internal 🔒                                               |🛑            |<br/>                                                  |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**IsolatedStakeManagerFactory**|Implementation                |<br/>                                                     |<br/>         |<br/>                                                  |
|└                              |createIsolatedManager         |External ❗️                                               |🛑            |NO❗️                                                   |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**Magnitude**                  |Implementation                |Utils                                                     |<br/>         |<br/>                                                  |
|└                              |\_computeDayMagnitude         |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_computeMagnitude            |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_yDeltas                     |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |encodeLinear                  |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_encodeLinear                |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |decodeLinear                  |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_decodeLinear                |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |computeMagnitude              |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |computeDayMagnitude           |External ❗️                                               |<br/>         |NO❗️                                                   |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**MaximusStakeManager**        |Implementation                |HSIStakeManager                                           |<br/>         |<br/>                                                  |
|└                              |<Constructor>                 |Public ❗️                                                 |🛑            |NO❗️                                                   |
|└                              |setExternalPerpetualFilter    |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |checkPerpetual                |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_checkPerpetual              |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_addPerpetual                |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |stakeEndAs                    |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_checkEndable                |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |checkEndable                  |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |flush                         |External ❗️                                               |🛑            |NO❗️                                                   |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**MulticallExtension**         |Implementation                |<br/>                                                     |<br/>         |<br/>                                                  |
|└                              |multicall                     |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |multicallWithDeadline         |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |multicallWithPreviousBlockHash|External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_multicall                   |Internal 🔒                                               |🛑            |<br/>                                                  |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**SingletonHedronManager**     |Implementation                |UnderlyingStakeManager                                    |<br/>         |<br/>                                                  |
|└                              |createTo                      |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_createTo                    |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |mintHedronRewards             |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_mintHedron                  |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_mintNativeHedron            |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_mintInstancedHedron         |Internal 🔒                                               |🛑            |<br/>                                                  |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**StakeEnder**                 |Implementation                |Magnitude, SingletonHedronManager                         |<br/>         |<br/>                                                  |
|└                              |stakeEndByConsent             |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |\_verifyStakeMatchesIndex     |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_stakeEndByConsent           |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |stakeEndByConsentForMany      |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |\_stakeEnd                    |Internal 🔒                                               |🛑            |<br/>                                                  |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**StakeInfo**                  |Implementation                |Magnitude                                                 |<br/>         |<br/>                                                  |
|└                              |verifyStakeOwnership          |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_verifyStakeOwnership        |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |verifyCustodian               |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_verifyCustodian             |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |stakeIdToOwner                |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_stakeIdToOwner              |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |stakeIdToInfo                 |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_stakeIdToInfo               |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |stakeIdToIndex                |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_stakeIdToIndex              |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |encodeInfo                    |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_encodeInfo                  |Internal 🔒                                               |<br/>         |<br/>                                                  |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**StakeManager**               |Implementation                |TransferrableStakeManager, EarningsOracle                 |<br/>         |<br/>                                                  |
|└                              |<Constructor>                 |Public ❗️                                                 |🛑            |EarningsOracle                                         |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**StakeStarter**               |Implementation                |StakeEnder                                                |<br/>         |<br/>                                                  |
|└                              |stakeStartFromBalanceFor      |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |stakeStartFromWithdrawableFor |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |stakeStartFromUnattributedFor |External ❗️                                               |💵            |NO❗️                                                   |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**Tipper**                     |Implementation                |Bank, UnderlyingStakeable, CurrencyList, EncodableSettings|<br/>         |<br/>                                                  |
|└                              |<Constructor>                 |Public ❗️                                                 |🛑            |Bank UnderlyingStakeable CurrencyList EncodableSettings|
|└                              |stakeIdTipSize                |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_stakeIdTipSize              |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_executeTipList              |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |encodeTipSettings             |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |encodedLinearWithMethod       |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_encodeTipSettings           |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |depositAndAddTipToStake       |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |removeTipFromStake            |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |\_removeTipFromStake          |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |addTipToStake                 |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |\_verifyTipAmountAllowed      |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_checkStakeCustodian         |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |\_addTipToStake               |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |<Receive Ether>               |External ❗️                                               |💵            |NO❗️                                                   |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**TransferrableStakeManager**  |Implementation                |StakeStarter                                              |<br/>         |<br/>                                                  |
|└                              |removeTransferrability        |External ❗️                                               |💵            |NO❗️                                                   |
|└                              |\_updateTransferrability      |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |canTransfer                   |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_canTransfer                 |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |stakeTransfer                 |External ❗️                                               |💵            |NO❗️                                                   |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**UnderlyingStakeManager**     |Implementation                |GoodAccounting                                            |<br/>         |<br/>                                                  |
|└                              |\_stakeStartFor               |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |\_stakeEnd                    |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |stakeStart                    |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |stakeEnd                      |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_stakeEndByIndexAndId        |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |stakeEndById                  |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |\_stakeRestartById            |Internal 🔒                                               |🛑            |<br/>                                                  |
|└                              |stakeRestartById              |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |stakeRestartManyById          |External ❗️                                               |🛑            |NO❗️                                                   |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**UnderlyingStakeable**        |Implementation                |MulticallExtension, Utils, IUnderlyingStakeable           |<br/>         |<br/>                                                  |
|└                              |\_getStake                    |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |stakeCount                    |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_stakeCount                  |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |balanceOf                     |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_balanceOf                   |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |stakeLists                    |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |currentDay                    |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_currentDay                  |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |globalInfo                    |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |isEarlyEnding                 |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_isEarlyEnding               |Internal 🔒                                               |<br/>         |<br/>                                                  |
|└                              |stakeStart                    |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |stakeEnd                      |External ❗️                                               |🛑            |NO❗️                                                   |
|└                              |stakeGoodAccounting           |External ❗️                                               |🛑            |NO❗️                                                   |
|<br/>                          |<br/>                         |<br/>                                                     |<br/>         |<br/>                                                  |
|**Utils**                      |Implementation                |<br/>                                                     |<br/>         |<br/>                                                  |
|└                              |isOneAtIndex                  |External ❗️                                               |<br/>         |NO❗️                                                   |
|└                              |\_isOneAtIndex                |Internal 🔒                                               |<br/>         |<br/>                                                  |

<br/>

Legend

<br/>

|Symbol|Meaning                  |
|------|-------------------------|
|🛑    |Function can modify state|
|💵    |Function is payable      |

<br/>

</div> \_\_\_\_ <sub> Thinking about smart contract security? We can provide training, ongoing advice, and smart contract auditing. \[Contact us\](https://diligence.consensys.net/contact/). </sub>

<br/>

This file was generated by Swimm. [Click here to view it in the app](https://app.swimm.io/repos/Z2l0aHViJTNBJTNBc3Rha2UtbWFuYWdlciUzQSUzQWhleHBheS1kYXk=/docs/tg2i63y1).
