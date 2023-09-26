
[<img width="200" alt="get in touch with Consensys Diligence" src="https://user-images.githubusercontent.com/2865694/56826101-91dcf380-685b-11e9-937c-af49c2510aa0.png">](https://diligence.consensys.net)<br/>
<sup>
[[  🌐  ](https://diligence.consensys.net)  [  📩  ](mailto:diligence@consensys.net)  [  🔥  ](https://consensys.github.io/diligence/)]
</sup><br/><br/>



# Solidity Metrics for 'CLI'

## Table of contents

- [Scope](#t-scope)
    - [Source Units in Scope](#t-source-Units-in-Scope)
    - [Out of Scope](#t-out-of-scope)
        - [Excluded Source Units](#t-out-of-scope-excluded-source-units)
        - [Duplicate Source Units](#t-out-of-scope-duplicate-source-units)
        - [Doppelganger Contracts](#t-out-of-scope-doppelganger-contracts)
- [Report Overview](#t-report)
    - [Risk Summary](#t-risk)
    - [Source Lines](#t-source-lines)
    - [Inline Documentation](#t-inline-documentation)
    - [Components](#t-components)
    - [Exposed Functions](#t-exposed-functions)
    - [StateVariables](#t-statevariables)
    - [Capabilities](#t-capabilities)
    - [Dependencies](#t-package-imports)
    - [Totals](#t-totals)

## <span id=t-scope>Scope</span>

This section lists files that are in scope for the metrics report. 

- **Project:** `'CLI'`
- **Included Files:** 
    - ``
- **Excluded Paths:** 
    - ``
- **File Limit:** `undefined`
    - **Exclude File list Limit:** `undefined`

- **Workspace Repository:** `unknown` (`undefined`@`undefined`)

### <span id=t-source-Units-in-Scope>Source Units in Scope</span>

Source Units Analyzed: **`23`**<br>
Source Units in Scope: **`23`** (**100%**)

| Type | File   | Logic Contracts | Interfaces | Lines | nLines | nSLOC | Comment Lines | Complex. Score | Capabilities |
| ---- | ------ | --------------- | ---------- | ----- | ------ | ----- | ------------- | -------------- | ------------ | 
| 🎨 | ./contracts/AuthorizationManager.sol | 1 | **** | 114 | 114 | 47 | 65 | 23 | **** |
| 📝 | ./contracts/Bank.sol | 1 | **** | 292 | 282 | 171 | 107 | 87 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/CurrencyList.sol | 1 | **** | 57 | 57 | 38 | 14 | 21 | **** |
| 📝 | ./contracts/EarningsOracle.sol | 1 | **** | 232 | 228 | 149 | 77 | 66 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 🎨 | ./contracts/EncodableSettings.sol | 1 | **** | 446 | 432 | 252 | 185 | 117 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/ExistingStakeManager.sol | 1 | **** | 7 | 7 | 3 | 2 | 3 | **** |
| 🎨 | ./contracts/GoodAccounting.sol | 1 | **** | 137 | 129 | 91 | 36 | 38 | **** |
| 📝 | ./contracts/HSIStakeManager.sol | 1 | **** | 257 | 246 | 166 | 78 | 98 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/IsolatedStakeManager.sol | 1 | **** | 254 | 254 | 155 | 97 | 96 | **<abbr title='Payable Functions'>💰</abbr>** |
| 📝 | ./contracts/IsolatedStakeManagerFactory.sol | 1 | **** | 27 | 27 | 18 | 7 | 21 | **<abbr title='Uses Hash-Functions'>🧮</abbr>** |
| 📝 | ./contracts/Magnitude.sol | 1 | **** | 229 | 213 | 146 | 73 | 87 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/MaximusStakeManager.sol | 1 | **** | 180 | 175 | 102 | 76 | 67 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/MulticallExtension.sol | 1 | **** | 99 | 88 | 59 | 27 | 25 | **<abbr title='DelegateCall'>👥</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/SingletonHedronManager.sol | 1 | **** | 87 | 87 | 72 | 13 | 30 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/StakeEnder.sol | 1 | **** | 298 | 288 | 246 | 41 | 102 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/StakeInfo.sol | 1 | **** | 137 | 137 | 51 | 84 | 35 | **** |
| 📝 | ./contracts/StakeManager.sol | 1 | **** | 9 | 9 | 6 | 1 | 6 | **** |
| 📝 | ./contracts/StakeStarter.sol | 1 | **** | 89 | 74 | 51 | 21 | 34 | **<abbr title='Payable Functions'>💰</abbr>** |
| 🎨 | ./contracts/Tipper.sol | 1 | **** | 548 | 510 | 358 | 151 | 150 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/TransferableStakeManager.sol | 1 | **** | 107 | 107 | 73 | 33 | 37 | **<abbr title='Payable Functions'>💰</abbr>** |
| 📝 | ./contracts/UnderlyingStakeManager.sol | 1 | **** | 196 | 189 | 115 | 72 | 56 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 🎨 | ./contracts/UnderlyingStakeable.sol | 1 | **** | 139 | 122 | 55 | 75 | 38 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/Utils.sol | 1 | **** | 93 | 93 | 42 | 50 | 85 | **<abbr title='Uses Assembly'>🖥</abbr>** |
| 📝🎨 | **Totals** | **23** | **** | **4034**  | **3868** | **2466** | **1385** | **1322** | **<abbr title='Uses Assembly'>🖥</abbr><abbr title='Payable Functions'>💰</abbr><abbr title='DelegateCall'>👥</abbr><abbr title='Uses Hash-Functions'>🧮</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |

<sub>
Legend: <a onclick="toggleVisibility('table-legend', this)">[➕]</a>
<div id="table-legend" style="display:none">

<ul>
<li> <b>Lines</b>: total lines of the source unit </li>
<li> <b>nLines</b>: normalized lines of the source unit (e.g. normalizes functions spanning multiple lines) </li>
<li> <b>nSLOC</b>: normalized source lines of code (only source-code lines; no comments, no blank lines) </li>
<li> <b>Comment Lines</b>: lines containing single or block comments </li>
<li> <b>Complexity Score</b>: a custom complexity score derived from code statements that are known to introduce code complexity (branches, loops, calls, external interfaces, ...) </li>
</ul>

</div>
</sub>


#### <span id=t-out-of-scope>Out of Scope</span>

##### <span id=t-out-of-scope-excluded-source-units>Excluded Source Units</span>

Source Units Excluded: **`0`**

<a onclick="toggleVisibility('excluded-files', this)">[➕]</a>
<div id="excluded-files" style="display:none">
| File   |
| ------ |
| None |

</div>


##### <span id=t-out-of-scope-duplicate-source-units>Duplicate Source Units</span>

Duplicate Source Units Excluded: **`0`** 

<a onclick="toggleVisibility('duplicate-files', this)">[➕]</a>
<div id="duplicate-files" style="display:none">
| File   |
| ------ |
| None |

</div>

##### <span id=t-out-of-scope-doppelganger-contracts>Doppelganger Contracts</span>

Doppelganger Contracts: **`0`** 

<a onclick="toggleVisibility('doppelganger-contracts', this)">[➕]</a>
<div id="doppelganger-contracts" style="display:none">
| File   | Contract | Doppelganger | 
| ------ | -------- | ------------ |


</div>


## <span id=t-report>Report</span>

### Overview

The analysis finished with **`0`** errors and **`0`** duplicate files.





#### <span id=t-risk>Risk</span>

<div class="wrapper" style="max-width: 512px; margin: auto">
			<canvas id="chart-risk-summary"></canvas>
</div>

#### <span id=t-source-lines>Source Lines (sloc vs. nsloc)</span>

<div class="wrapper" style="max-width: 512px; margin: auto">
    <canvas id="chart-nsloc-total"></canvas>
</div>

#### <span id=t-inline-documentation>Inline Documentation</span>

- **Comment-to-Source Ratio:** On average there are`1.89` code lines per comment (lower=better).
- **ToDo's:** `0` 

#### <span id=t-components>Components</span>

| 📝Contracts   | 📚Libraries | 🔍Interfaces | 🎨Abstract |
| ------------- | ----------- | ------------ | ---------- |
| 18 | 0  | 0  | 5 |

#### <span id=t-exposed-functions>Exposed Functions</span>

This section lists functions that are explicitly declared public or payable. Please note that getter methods for public stateVars are not included.  

| 🌐Public   | 💰Payable |
| ---------- | --------- |
| 105 | 22  | 

| External   | Internal | Private | Pure | View |
| ---------- | -------- | ------- | ---- | ---- |
| 105 | 187  | 0 | 44 | 54 |

#### <span id=t-statevariables>StateVariables</span>

| Total      | 🌐Public  |
| ---------- | --------- |
| 70  | 25 |

#### <span id=t-capabilities>Capabilities</span>

| Solidity Versions observed | 🧪 Experimental Features | 💰 Can Receive Funds | 🖥 Uses Assembly | 💣 Has Destroyable Contracts | 
| -------------------------- | ------------------------ | -------------------- | ---------------- | ---------------------------- |
| `^0.8.18` |  | `yes` | `yes` <br/>(1 asm blocks) | **** | 

| 📤 Transfers ETH | ⚡ Low-Level Calls | 👥 DelegateCall | 🧮 Uses Hash Functions | 🔖 ECRecover | 🌀 New/Create/Create2 |
| ---------------- | ----------------- | --------------- | ---------------------- | ------------ | --------------------- |
| **** | **** | `yes` | `yes` | **** | **** | 

| ♻️ TryCatch | Σ Unchecked |
| ---------- | ----------- |
| **** | `yes` |

#### <span id=t-package-imports>Dependencies / External Imports</span>

| Dependency / Import Path | Count  | 
| ------------------------ | ------ |
| @openzeppelin/contracts/access/Ownable2Step.sol | 1 |
| @openzeppelin/contracts/token/ERC20/ERC20.sol | 1 |
| @openzeppelin/contracts/token/ERC20/IERC20.sol | 5 |
| @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol | 2 |
| @openzeppelin/contracts/token/ERC721/IERC721.sol | 1 |
| @openzeppelin/contracts/utils/Address.sol | 3 |

#### <span id=t-totals>Totals</span>

##### Summary

<div class="wrapper" style="max-width: 90%; margin: auto">
    <canvas id="chart-num-bar"></canvas>
</div>

##### AST Node Statistics

###### Function Calls

<div class="wrapper" style="max-width: 90%; margin: auto">
    <canvas id="chart-num-bar-ast-funccalls"></canvas>
</div>

###### Assembly Calls

<div class="wrapper" style="max-width: 90%; margin: auto">
    <canvas id="chart-num-bar-ast-asmcalls"></canvas>
</div>

###### AST Total

<div class="wrapper" style="max-width: 90%; margin: auto">
    <canvas id="chart-num-bar-ast"></canvas>
</div>

##### Inheritance Graph

<a onclick="toggleVisibility('surya-inherit', this)">[➕]</a>
<div id="surya-inherit" style="display:none">
<div class="wrapper" style="max-width: 512px; margin: auto">
    <div id="surya-inheritance" style="text-align: center;"></div> 
</div>
</div>

##### CallGraph

<a onclick="toggleVisibility('surya-call', this)">[➕]</a>
<div id="surya-call" style="display:none">
<div class="wrapper" style="max-width: 512px; margin: auto">
    <div id="surya-callgraph" style="text-align: center;"></div>
</div>
</div>

###### Contract Summary

<a onclick="toggleVisibility('surya-mdreport', this)">[➕]</a>
<div id="surya-mdreport" style="display:none">
 Sūrya's Description Report

 Files Description Table


|  File Name  |  SHA-1 Hash  |
|-------------|--------------|
| ./contracts/AuthorizationManager.sol | b3bd47b7ae71ae3fc3fba03a6742d62101d868d4 |
| ./contracts/Bank.sol | 4ee0a5461fe60d3e4b2a3c2641dcc0c22b1757b3 |
| ./contracts/CurrencyList.sol | b294ae13350f462799ec178c056891a4e6aabfa4 |
| ./contracts/EarningsOracle.sol | 55d1d62bc979af8e1f0caf3c5f029e109e3ef71b |
| ./contracts/EncodableSettings.sol | 45669a1534dbeace631d1ce1e38e1bc00a69a21c |
| ./contracts/ExistingStakeManager.sol | 645f443d16fe8ca9709e14c0d8759438f26e941a |
| ./contracts/GoodAccounting.sol | 4821f9e00a2e29eb8a6208c03f00cf6eb146e60c |
| ./contracts/HSIStakeManager.sol | 2ca00680f366898452828c48e35c97e633cb7530 |
| ./contracts/IsolatedStakeManager.sol | 94259497b7928ac487456c0f4204f5478a73289a |
| ./contracts/IsolatedStakeManagerFactory.sol | 3c684c746740fb01a7d4feec8afb80f15c3e6085 |
| ./contracts/Magnitude.sol | c8a310999ec8a19f33d833122c6e66aea34036a1 |
| ./contracts/MaximusStakeManager.sol | d29a536a0a333c87071cb6519e2e81fe94a9788a |
| ./contracts/MulticallExtension.sol | 88034c4f27d20ae95cc1edcee8b721908409325f |
| ./contracts/SingletonHedronManager.sol | 7e3596a3bc5b8ce52e446fe7c73c65461b10cb54 |
| ./contracts/StakeEnder.sol | b3b54fea8966ca72d6ce24f8ba993fece48487e1 |
| ./contracts/StakeInfo.sol | 55fafd0a1c12e20a8b9e9842eac43cb34abfd6e9 |
| ./contracts/StakeManager.sol | 23485c4872fc0fb51b170f1983040e0d83138899 |
| ./contracts/StakeStarter.sol | 3fe799e38990e94ec1f701b6835edc2f1dcd00d3 |
| ./contracts/Tipper.sol | a3f82d36593163c7fbcf2653cafacd5db5fdecca |
| ./contracts/TransferableStakeManager.sol | 2ccf85e7330a1d54e26ce0692d7eadd41795479c |
| ./contracts/UnderlyingStakeManager.sol | f37ae75ab81a36ac3e121d84370b1fb44090ec7e |
| ./contracts/UnderlyingStakeable.sol | ce18a5fb96b0eaaaf615ce6d9ad8a22cabf8881e |
| ./contracts/Utils.sol | 99cdba1b78f6c9620a712e4a3968c5990da33a81 |


 Contracts Description Table


|  Contract  |         Type        |       Bases      |                  |                 |
|:----------:|:-------------------:|:----------------:|:----------------:|:---------------:|
|     └      |  **Function Name**  |  **Visibility**  |  **Mutability**  |  **Modifiers**  |
||||||
| **AuthorizationManager** | Implementation | UnderlyingStakeable |||
| └ | <Constructor> | Public ❗️ | 🛑  |NO❗️ |
| └ | _setAuthorization | Internal 🔒 | 🛑  | |
| └ | _setAddressAuthorization | Internal 🔒 | 🛑  | |
| └ | isAddressAuthorized | External ❗️ |   |NO❗️ |
| └ | _isAddressAuthorized | Internal 🔒 |   | |
| └ | _isAuthorized | Internal 🔒 |   | |
| └ | _getAddressSetting | Internal 🔒 |   | |
||||||
| **Bank** | Implementation | Utils |||
| └ | _getUnattributed | Internal 🔒 |   | |
| └ | _getBalance | Internal 🔒 |   | |
| └ | getUnattributed | External ❗️ |   |NO❗️ |
| └ | clamp | External ❗️ |   |NO❗️ |
| └ | _clamp | Internal 🔒 |   | |
| └ | depositToken | External ❗️ |  💵 |NO❗️ |
| └ | depositTokenTo | External ❗️ |  💵 |NO❗️ |
| └ | _depositTokenTo | Internal 🔒 | 🛑  | |
| └ | collectUnattributed | External ❗️ |  💵 |NO❗️ |
| └ | _collectUnattributed | Internal 🔒 | 🛑  | |
| └ | collectUnattributedPercent | External ❗️ | 🛑  |NO❗️ |
| └ | withdrawTokenTo | External ❗️ |  💵 |NO❗️ |
| └ | _getTokenBalance | Internal 🔒 |   | |
| └ | _addToTokenWithdrawable | Internal 🔒 | 🛑  | |
| └ | _deductWithdrawable | Internal 🔒 | 🛑  | |
| └ | _depositTokenFrom | Internal 🔒 | 🛑  | |
| └ | depositTokenUnattributed | External ❗️ | 🛑  |NO❗️ |
| └ | _withdrawTokenTo | Internal 🔒 | 🛑  | |
| └ | _attributeFunds | Internal 🔒 | 🛑  | |
||||||
| **CurrencyList** | Implementation | Utils |||
| └ | addCurrencyToList | External ❗️ | 🛑  |NO❗️ |
| └ | _addCurrencyToList | Internal 🔒 | 🛑  | |
| └ | currencyListSize | External ❗️ |   |NO❗️ |
||||||
| **EarningsOracle** | Implementation | Utils |||
| └ | <Constructor> | Public ❗️ | 🛑  |NO❗️ |
| └ | totalsCount | External ❗️ |   |NO❗️ |
| └ | payoutDelta | External ❗️ |   |NO❗️ |
| └ | payoutDeltaTruncated | External ❗️ |   |NO❗️ |
| └ | _storeDay | Internal 🔒 | 🛑  | |
| └ | _readTotals | Internal 🔒 |   | |
| └ | _saveDay | Internal 🔒 | 🛑  | |
| └ | storeDay | External ❗️ | 🛑  |NO❗️ |
| └ | incrementDay | External ❗️ | 🛑  |NO❗️ |
| └ | _storeDays | Internal 🔒 | 🛑  | |
| └ | storeDays | External ❗️ | 🛑  |NO❗️ |
| └ | catchUpDays | External ❗️ | 🛑  |NO❗️ |
| └ | _validateTotals | Internal 🔒 |   | |
||||||
| **EncodableSettings** | Implementation | StakeInfo |||
| └ | defaultEncodedSettings | External ❗️ |   |NO❗️ |
| └ | stakeIdSettings | External ❗️ |   |NO❗️ |
| └ | decodeConsentAbilities | External ❗️ |   |NO❗️ |
| └ | _decodeConsentAbilities | Internal 🔒 |   | |
| └ | updateSettings | External ❗️ |  💵 |NO❗️ |
| └ | updateSettingsEncoded | External ❗️ |  💵 |NO❗️ |
| └ | _updateSettingsEncoded | Internal 🔒 | 🛑  | |
| └ | _logPreservedSettingsUpdate | Internal 🔒 | 🛑  | |
| └ | _logSettingsUpdate | Internal 🔒 | 🛑  | |
| └ | readEncodedSettings | External ❗️ |   |NO❗️ |
| └ | _readEncodedSettings | Internal 🔒 |   | |
| └ | encodeSettings | External ❗️ |   |NO❗️ |
| └ | _encodeSettings | Internal 🔒 |   | |
| └ | decodeSettings | External ❗️ |   |NO❗️ |
| └ | _decodeSettings | Internal 🔒 |   | |
| └ | encodeConsentAbilities | External ❗️ |   |NO❗️ |
| └ | _encodeConsentAbilities | Internal 🔒 |   | |
| └ | _defaultSettings | Internal 🔒 |   | |
| └ | decrementCopyIterations | External ❗️ |   |NO❗️ |
| └ | _decrementCopyIterations | Internal 🔒 |   | |
| └ | defaultSettings | External ❗️ |   |NO❗️ |
||||||
| **ExistingStakeManager** | Implementation | MaximusStakeManager |||
||||||
| **GoodAccounting** | Implementation | Tipper |||
| └ | checkAndDoStakeGoodAccounting | External ❗️ | 🛑  |NO❗️ |
| └ | checkAndDoStakeGoodAccountingFor | External ❗️ | 🛑  |NO❗️ |
| └ | isGoodAccountable | External ❗️ |   |NO❗️ |
| └ | isStakeIdGoodAccountable | External ❗️ |   |NO❗️ |
| └ | _isGoodAccountable | Internal 🔒 |   | |
| └ | _checkAndDoStakeGoodAccounting | Internal 🔒 | 🛑  | |
| └ | stakeGoodAccounting | External ❗️ | 🛑  |NO❗️ |
| └ | _stakeGoodAccounting | Internal 🔒 | 🛑  | |
||||||
| **HSIStakeManager** | Implementation | StakeEnder |||
| └ | defaultEncodedSettings | External ❗️ |   |NO❗️ |
| └ | _defaultSettings | Internal 🔒 |   | |
| └ | depositHsi | External ❗️ | 🛑  |NO❗️ |
| └ | _deposit721 | Internal 🔒 | 🛑  | |
| └ | hsiAddressToId | External ❗️ |   |NO❗️ |
| └ | _hsiAddressToId | Internal 🔒 |   | |
| └ | withdrawHsi | External ❗️ | 🛑  |NO❗️ |
| └ | _hsiCount | Internal 🔒 |   | |
| └ | hsiCount | External ❗️ |   |NO❗️ |
| └ | _withdraw721 | Internal 🔒 | 🛑  | |
| └ | hsiStakeEndMany | External ❗️ |  💵 |NO❗️ |
| └ | hsiStakeEndManyWithTipTo | External ❗️ |  💵 |NO❗️ |
| └ | _hsiStakeEndMany | Internal 🔒 | 🛑  | |
| └ | _verifyStakeMatchesIndex | Internal 🔒 |   | |
| └ | _stakeEnd | Internal 🔒 | 🛑  | |
| └ | _rewriteIndex | Internal 🔒 | 🛑  | |
| └ | _stakeStartFor | Internal 🔒 | 🛑  | |
| └ | _mintHedron | Internal 🔒 | 🛑  | |
| └ | _checkStakeCustodian | Internal 🔒 |   | |
||||||
| **IsolatedStakeManager** | Implementation | Ownable2Step, AuthorizationManager, GoodAccounting |||
| └ | <Constructor> | Public ❗️ | 🛑  | AuthorizationManager |
| └ | setAuthorization | External ❗️ | 🛑  | onlyOwner |
| └ | setStartAuthorization | External ❗️ | 🛑  | onlyOwner |
| └ | startAuthorizationKey | External ❗️ |   |NO❗️ |
| └ | stakeStart | External ❗️ | 🛑  |NO❗️ |
| └ | stakeStartWithAuthorization | External ❗️ | 🛑  |NO❗️ |
| └ | transferFromOwner | External ❗️ | 🛑  |NO❗️ |
| └ | stakeEnd | External ❗️ | 🛑  |NO❗️ |
| └ | transferToOwner | External ❗️ |  💵 |NO❗️ |
| └ | checkAndStakeEnd | External ❗️ | 🛑  |NO❗️ |
| └ | _endStake | Internal 🔒 | 🛑  | |
| └ | _transferToOwner | Internal 🔒 | 🛑  | |
| └ | _settingsCheck | Internal 🔒 |   | |
| └ | _startAuthorizationKey | Internal 🔒 |   | |
| └ | _stakeStart | Internal 🔒 | 🛑  | |
| └ | _transferFromOwner | Internal 🔒 | 🛑  | |
||||||
| **IsolatedStakeManagerFactory** | Implementation |  |||
| └ | createIsolatedManager | External ❗️ | 🛑  |NO❗️ |
||||||
| **Magnitude** | Implementation | Utils |||
| └ | _computeDayMagnitude | Internal 🔒 |   | |
| └ | _computeMagnitude | Internal 🔒 |   | |
| └ | _getDelta | Internal 🔒 |   | |
| └ | encodeLinear | External ❗️ |   |NO❗️ |
| └ | _encodeLinear | Internal 🔒 |   | |
| └ | decodeLinear | External ❗️ |   |NO❗️ |
| └ | _decodeLinear | Internal 🔒 |   | |
| └ | computeMagnitude | External ❗️ |   |NO❗️ |
| └ | computeDayMagnitude | External ❗️ |   |NO❗️ |
||||||
| **MaximusStakeManager** | Implementation | HSIStakeManager |||
| └ | <Constructor> | Public ❗️ | 🛑  |NO❗️ |
| └ | setExternalPerpetualFilter | External ❗️ | 🛑  |NO❗️ |
| └ | checkPerpetual | External ❗️ | 🛑  |NO❗️ |
| └ | _checkPerpetual | Internal 🔒 | 🛑  | |
| └ | _addPerpetual | Internal 🔒 | 🛑  | |
| └ | stakeEndAs | External ❗️ | 🛑  |NO❗️ |
| └ | _checkEndable | Internal 🔒 |   | |
| └ | checkEndable | External ❗️ |   |NO❗️ |
| └ | flush | External ❗️ | 🛑  |NO❗️ |
||||||
| **MulticallExtension** | Implementation | Utils |||
| └ | multicall | External ❗️ | 🛑  |NO❗️ |
| └ | multicallWithDeadline | External ❗️ | 🛑  |NO❗️ |
| └ | multicallWithPreviousBlockHash | External ❗️ | 🛑  |NO❗️ |
| └ | _multicall | Internal 🔒 | 🛑  | |
||||||
| **SingletonHedronManager** | Implementation | UnderlyingStakeManager |||
| └ | createTo | External ❗️ |   |NO❗️ |
| └ | _createTo | Internal 🔒 |   | |
| └ | mintHedronRewards | External ❗️ | 🛑  |NO❗️ |
| └ | _mintHedron | Internal 🔒 | 🛑  | |
||||||
| **StakeEnder** | Implementation | Magnitude, SingletonHedronManager |||
| └ | stakeEndByConsent | External ❗️ |  💵 |NO❗️ |
| └ | stakeEndByConsentWithTipTo | External ❗️ |  💵 |NO❗️ |
| └ | _stakeEndByConsentWithTipTo | Internal 🔒 | 🛑  | |
| └ | _verifyStakeMatchesIndex | Internal 🔒 |   | |
| └ | _stakeEndByConsent | Internal 🔒 | 🛑  | |
| └ | stakeEndByConsentForMany | External ❗️ |  💵 |NO❗️ |
| └ | stakeEndByConsentForManyWithTipTo | External ❗️ |  💵 |NO❗️ |
| └ | _stakeEndByConsentForManyWithTipTo | Internal 🔒 | 🛑  | |
| └ | _stakeEnd | Internal 🔒 | 🛑  | |
||||||
| **StakeInfo** | Implementation | Magnitude |||
| └ | verifyStakeOwnership | External ❗️ |   |NO❗️ |
| └ | _verifyStakeOwnership | Internal 🔒 |   | |
| └ | verifyCustodian | External ❗️ |   |NO❗️ |
| └ | _verifyCustodian | Internal 🔒 |   | |
| └ | stakeIdToOwner | External ❗️ |   |NO❗️ |
| └ | _stakeIdToOwner | Internal 🔒 |   | |
| └ | stakeIdToInfo | External ❗️ |   |NO❗️ |
| └ | _stakeIdToInfo | Internal 🔒 |   | |
| └ | stakeIdToIndex | External ❗️ |   |NO❗️ |
| └ | _stakeIdToIndex | Internal 🔒 |   | |
| └ | encodeInfo | External ❗️ |   |NO❗️ |
| └ | _encodeInfo | Internal 🔒 |   | |
||||||
| **StakeManager** | Implementation | TransferableStakeManager, EarningsOracle |||
| └ | <Constructor> | Public ❗️ | 🛑  | EarningsOracle |
||||||
| **StakeStarter** | Implementation | StakeEnder |||
| └ | stakeStartFromBalanceFor | External ❗️ |  💵 |NO❗️ |
| └ | stakeStartFromWithdrawableFor | External ❗️ |  💵 |NO❗️ |
| └ | stakeStartFromUnattributedFor | External ❗️ |  💵 |NO❗️ |
||||||
| **Tipper** | Implementation | Bank, UnderlyingStakeable, CurrencyList, EncodableSettings |||
| └ | <Constructor> | Public ❗️ | 🛑  | Bank UnderlyingStakeable CurrencyList EncodableSettings |
| └ | stakeIdTipSize | External ❗️ |   |NO❗️ |
| └ | _stakeIdTipSize | Internal 🔒 |   | |
| └ | computeTip | External ❗️ |   |NO❗️ |
| └ | _computeTip | Internal 🔒 |   | |
| └ | _executeTipList | Internal 🔒 | 🛑  | |
| └ | encodeTipSettings | External ❗️ |   |NO❗️ |
| └ | _encodeTipSettings | Internal 🔒 |   | |
| └ | depositAndAddTipToStake | External ❗️ |  💵 |NO❗️ |
| └ | removeAllTips | External ❗️ | 🛑  |NO❗️ |
| └ | _removeAllTips | Internal 🔒 | 🛑  | |
| └ | removeTipsFromStake | External ❗️ |  💵 |NO❗️ |
| └ | _removeTipsFromStake | Internal 🔒 | 🛑  | |
| └ | addTipToStake | External ❗️ |  💵 |NO❗️ |
| └ | _verifyTipAmountAllowed | Internal 🔒 |   | |
| └ | _checkStakeCustodian | Internal 🔒 |   | |
| └ | _addTipToStake | Internal 🔒 | 🛑  | |
| └ | <Receive Ether> | External ❗️ |  💵 |NO❗️ |
||||||
| **TransferableStakeManager** | Implementation | StakeStarter |||
| └ | removeTransferrability | External ❗️ |  💵 |NO❗️ |
| └ | _removeTransferrability | Internal 🔒 | 🛑  | |
| └ | removeTransferrabilityFromEncodedSettings | External ❗️ |   |NO❗️ |
| └ | _removeTransferrabilityFromEncodedSettings | Internal 🔒 |   | |
| └ | canTransfer | External ❗️ |   |NO❗️ |
| └ | _canTransfer | Internal 🔒 |   | |
| └ | stakeTransfer | External ❗️ |  💵 |NO❗️ |
||||||
| **UnderlyingStakeManager** | Implementation | GoodAccounting |||
| └ | _stakeStartFor | Internal 🔒 | 🛑  | |
| └ | _stakeEnd | Internal 🔒 | 🛑  | |
| └ | stakeStart | External ❗️ | 🛑  |NO❗️ |
| └ | stakeEnd | External ❗️ | 🛑  |NO❗️ |
| └ | _stakeEndByIndexAndId | Internal 🔒 | 🛑  | |
| └ | stakeEndById | External ❗️ | 🛑  |NO❗️ |
| └ | _stakeRestartById | Internal 🔒 | 🛑  | |
| └ | stakeRestartById | External ❗️ | 🛑  |NO❗️ |
| └ | stakeRestartManyById | External ❗️ | 🛑  |NO❗️ |
||||||
| **UnderlyingStakeable** | Implementation | MulticallExtension, IUnderlyingStakeable |||
| └ | _getStake | Internal 🔒 |   | |
| └ | stakeCount | External ❗️ |   |NO❗️ |
| └ | _stakeCount | Internal 🔒 |   | |
| └ | balanceOf | External ❗️ |   |NO❗️ |
| └ | _balanceOf | Internal 🔒 |   | |
| └ | stakeLists | External ❗️ |   |NO❗️ |
| └ | currentDay | External ❗️ |   |NO❗️ |
| └ | _currentDay | Internal 🔒 |   | |
| └ | globalInfo | External ❗️ |   |NO❗️ |
| └ | isEarlyEnding | External ❗️ |   |NO❗️ |
| └ | _isEarlyEnding | Internal 🔒 |   | |
| └ | stakeStart | External ❗️ | 🛑  |NO❗️ |
| └ | stakeEnd | External ❗️ | 🛑  |NO❗️ |
| └ | stakeGoodAccounting | External ❗️ | 🛑  |NO❗️ |
||||||
| **Utils** | Implementation |  |||
| └ | isOneAtIndex | External ❗️ |   |NO❗️ |
| └ | _isOneAtIndex | Internal 🔒 |   | |
| └ | _bubbleRevert | Internal 🔒 |   | |


 Legend

|  Symbol  |  Meaning  |
|:--------:|-----------|
|    🛑    | Function can modify state |
|    💵    | Function is payable |
 

</div>
____
<sub>
Thinking about smart contract security? We can provide training, ongoing advice, and smart contract auditing. [Contact us](https://diligence.consensys.net/contact/).
</sub>


