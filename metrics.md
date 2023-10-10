
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

Source Units Analyzed: **`25`**<br>
Source Units in Scope: **`25`** (**100%**)

| Type | File   | Logic Contracts | Interfaces | Lines | nLines | nSLOC | Comment Lines | Complex. Score | Capabilities |
| ---- | ------ | --------------- | ---------- | ----- | ------ | ----- | ------------- | -------------- | ------------ |
| 🎨 | contracts/AuthorizationManager.sol | 1 | **** | 114 | 114 | 47 | 65 | 23 | **** |
| 📝 | contracts/Bank.sol | 1 | **** | 310 | 300 | 182 | 114 | 93 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 🎨 | contracts/Communis.sol | 1 | **** | 45 | 22 | 17 | 1 | 25 | **** |
| 📝 | contracts/CurrencyList.sol | 1 | **** | 54 | 54 | 36 | 14 | 23 | **<abbr title='Payable Functions'>💰</abbr>** |
| 📝 | contracts/EarningsOracle.sol | 1 | **** | 236 | 232 | 153 | 77 | 80 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 🎨 | contracts/EncodableSettings.sol | 1 | **** | 416 | 402 | 202 | 206 | 105 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/ExistingStakeManager.sol | 1 | **** | 7 | 7 | 3 | 2 | 3 | **** |
| 🎨 | contracts/GoodAccounting.sol | 1 | **** | 137 | 129 | 91 | 36 | 38 | **** |
| 📝 | contracts/HSIStakeManager.sol | 1 | **** | 266 | 252 | 175 | 75 | 106 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/IsolatedStakeManager.sol | 1 | **** | 253 | 253 | 154 | 97 | 96 | **<abbr title='Payable Functions'>💰</abbr>** |
| 📝 | contracts/IsolatedStakeManagerFactory.sol | 1 | **** | 27 | 27 | 18 | 7 | 24 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Uses Hash-Functions'>🧮</abbr>** |
| 📝 | contracts/Magnitude.sol | 1 | **** | 239 | 223 | 151 | 78 | 89 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/MaximusStakeManager.sol | 1 | **** | 179 | 174 | 101 | 76 | 78 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/MulticallExtension.sol | 1 | **** | 99 | 88 | 59 | 27 | 25 | **<abbr title='DelegateCall'>👥</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/SingletonCommunis.sol | 1 | **** | 448 | 441 | 355 | 54 | 214 | **<abbr title='Payable Functions'>💰</abbr><abbr title='TryCatch Blocks'>♻️</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/SingletonMintManager.sol | 1 | **** | 94 | 91 | 76 | 13 | 30 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/StakeEnder.sol | 1 | **** | 303 | 293 | 251 | 41 | 103 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/StakeInfo.sol | 1 | **** | 145 | 145 | 59 | 84 | 35 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/StakeManager.sol | 1 | **** | 6 | 6 | 3 | 1 | 3 | **** |
| 📝 | contracts/StakeStarter.sol | 1 | **** | 89 | 74 | 51 | 21 | 34 | **<abbr title='Payable Functions'>💰</abbr>** |
| 🎨 | contracts/Tipper.sol | 1 | **** | 554 | 516 | 362 | 153 | 154 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/TransferableStakeManager.sol | 1 | **** | 110 | 110 | 76 | 33 | 37 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/UnderlyingStakeManager.sol | 1 | **** | 225 | 207 | 132 | 73 | 63 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 🎨 | contracts/UnderlyingStakeable.sol | 1 | **** | 143 | 118 | 55 | 71 | 35 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | contracts/Utils.sol | 1 | **** | 96 | 96 | 44 | 51 | 81 | **<abbr title='Uses Assembly'>🖥</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝🎨 | **Totals** | **25** | **** | **4595**  | **4374** | **2853** | **1470** | **1597** | **<abbr title='Uses Assembly'>🖥</abbr><abbr title='Payable Functions'>💰</abbr><abbr title='DelegateCall'>👥</abbr><abbr title='Uses Hash-Functions'>🧮</abbr><abbr title='TryCatch Blocks'>♻️</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |

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

- **Comment-to-Source Ratio:** On average there are`2.08` code lines per comment (lower=better).
- **ToDo's:** `0`

#### <span id=t-components>Components</span>

| 📝Contracts   | 📚Libraries | 🔍Interfaces | 🎨Abstract |
| ------------- | ----------- | ------------ | ---------- |
| 19 | 0  | 0  | 6 |

#### <span id=t-exposed-functions>Exposed Functions</span>

This section lists functions that are explicitly declared public or payable. Please note that getter methods for public stateVars are not included.

| 🌐Public   | 💰Payable |
| ---------- | --------- |
| 120 | 41  |

| External   | Internal | Private | Pure | View |
| ---------- | -------- | ------- | ---- | ---- |
| 120 | 194  | 0 | 47 | 61 |

#### <span id=t-statevariables>StateVariables</span>

| Total      | 🌐Public  |
| ---------- | --------- |
| 76  | 28 |

#### <span id=t-capabilities>Capabilities</span>

| Solidity Versions observed | 🧪 Experimental Features | 💰 Can Receive Funds | 🖥 Uses Assembly | 💣 Has Destroyable Contracts |
| -------------------------- | ------------------------ | -------------------- | ---------------- | ---------------------------- |
| `^0.8.18` |  | `yes` | `yes` <br/>(1 asm blocks) | **** |

| 📤 Transfers ETH | ⚡ Low-Level Calls | 👥 DelegateCall | 🧮 Uses Hash Functions | 🔖 ECRecover | 🌀 New/Create/Create2 |
| ---------------- | ----------------- | --------------- | ---------------------- | ------------ | --------------------- |
| **** | **** | `yes` | `yes` | **** | **** |

| ♻️ TryCatch | Σ Unchecked |
| ---------- | ----------- |
| `yes` | `yes` |

#### <span id=t-package-imports>Dependencies / External Imports</span>

| Dependency / Import Path | Count  |
| ------------------------ | ------ |
| @openzeppelin/contracts/access/Ownable2Step.sol | 1 |
| solmate/src/tokens/ERC20.sol | 5 |
| solmate/src/tokens/ERC721.sol | 1 |
| solmate/src/utils/SafeTransferLib.sol | 3 |

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
| contracts/AuthorizationManager.sol | 37c2c14a2d122806269d0ec2ba0ee987c36e0795 |
| contracts/Bank.sol | dfd1c4473660c15b2395747618eb608484403002 |
| contracts/Communis.sol | fad2401c8e50b86839eca58a50dd34231c6757c4 |
| contracts/CurrencyList.sol | 6edb2f225796c57dffe1044f49cb663b1ff8ebe4 |
| contracts/EarningsOracle.sol | f2d45921d81672efea8d4d58106eaf0be37b2d53 |
| contracts/EncodableSettings.sol | 49898c08bc77f9e4c18d720418529c05e4a90825 |
| contracts/ExistingStakeManager.sol | 645f443d16fe8ca9709e14c0d8759438f26e941a |
| contracts/GoodAccounting.sol | 0e182bd47e07464c1b9a8bb2a0d7b3f8e407ab38 |
| contracts/HSIStakeManager.sol | 03c948f9cef25761c8787785c54781219117d4f7 |
| contracts/IsolatedStakeManager.sol | 54780fa758a31235742b6a7e6a89dcf2c2f86ab5 |
| contracts/IsolatedStakeManagerFactory.sol | 1aaee8c135b9cb551e880a167a9b610cec452962 |
| contracts/Magnitude.sol | 44450908a79f5f9d4ccccac03730ed3c57d4c7d3 |
| contracts/MaximusStakeManager.sol | c3261cd6d8c35f54b13c575582372abcdc68d0df |
| contracts/MulticallExtension.sol | 88034c4f27d20ae95cc1edcee8b721908409325f |
| contracts/SingletonCommunis.sol | 95bc4e3f86d9dbf8b8d1874970dc6ae2aa0ca53f |
| contracts/SingletonMintManager.sol | 0361c8592fba995c64441d912f872e4639e9af5b |
| contracts/StakeEnder.sol | b72c78fe3f65077cc18f5bd8613952211e4a60e8 |
| contracts/StakeInfo.sol | a29b9828acaf1e8335ddb8732fe799f0fc40c001 |
| contracts/StakeManager.sol | a6bba67bddb847d7d2663be7b1267a04510d926b |
| contracts/StakeStarter.sol | 6d13257f7e8d12c0f86d9c726f0e29fd5580b315 |
| contracts/Tipper.sol | 89adc143f1c19885cb8ad470216f75ace7238d7e |
| contracts/TransferableStakeManager.sol | 2454a6bc6d44dab7ba97dca18e8e35d316000171 |
| contracts/UnderlyingStakeManager.sol | 6c4788310b9983a94e71e9238362857805ba64ab |
| contracts/UnderlyingStakeable.sol | 0fa69704662e0ee14bfff25bfc4e2b4b5d94009d |
| contracts/Utils.sol | a1781e4a3cd34555673c7db2cf9be694abfd9535 |


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
| └ | _getAddressSettings | Internal 🔒 |   | |
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
| └ | collectUnattributedPercent | External ❗️ |  💵 |NO❗️ |
| └ | withdrawTokenTo | External ❗️ |  💵 |NO❗️ |
| └ | _getTokenBalance | Internal 🔒 |   | |
| └ | _addToTokenWithdrawable | Internal 🔒 | 🛑  | |
| └ | _deductWithdrawable | Internal 🔒 | 🛑  | |
| └ | _depositTokenFrom | Internal 🔒 | 🛑  | |
| └ | depositTokenUnattributed | External ❗️ | 🛑  |NO❗️ |
| └ | _withdrawTokenTo | Internal 🔒 | 🛑  | |
| └ | _attributeFunds | Internal 🔒 | 🛑  | |
||||||
| **Communis** | Implementation | ERC20 |||
| └ | mintEndBonus | External ❗️ | 🛑  |NO❗️ |
| └ | mintGoodAccountingBonus | External ❗️ | 🛑  |NO❗️ |
| └ | mintStakeBonus | External ❗️ | 🛑  |NO❗️ |
| └ | mintStartBonus | External ❗️ | 🛑  |NO❗️ |
| └ | stakeIdGoodAccountingBonusPayout | External ❗️ |   |NO❗️ |
| └ | stakeIdEndBonusPayout | External ❗️ |   |NO❗️ |
| └ | stakeIdStartBonusPayout | External ❗️ |   |NO❗️ |
| └ | addressStakedCodeak | External ❗️ |   |NO❗️ |
| └ | withdrawStakedCodeak | External ❗️ | 🛑  |NO❗️ |
| └ | getPayout | External ❗️ |   |NO❗️ |
| └ | getStartBonusPayout | External ❗️ |   |NO❗️ |
||||||
| **CurrencyList** | Implementation | Utils |||
| └ | addCurrencyToList | External ❗️ |  💵 |NO❗️ |
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
| └ | storeDay | External ❗️ |  💵 |NO❗️ |
| └ | incrementDay | External ❗️ |  💵 |NO❗️ |
| └ | _storeDays | Internal 🔒 | 🛑  | |
| └ | storeDays | External ❗️ |  💵 |NO❗️ |
| └ | catchUpDays | External ❗️ |  💵 |NO❗️ |
| └ | _validateTotals | Internal 🔒 |   | |
||||||
| **EncodableSettings** | Implementation | StakeInfo |||
| └ | defaultEncodedSettings | External ❗️ |   |NO❗️ |
| └ | defaultSettings | External ❗️ |   |NO❗️ |
| └ | _defaultEncodedSettings | Internal 🔒 |   | |
| └ | stakeIdSettings | External ❗️ |   |NO❗️ |
| └ | decodeConsentAbilities | External ❗️ |   |NO❗️ |
| └ | _decodeConsentAbilities | Internal 🔒 |   | |
| └ | updateSettingsEncoded | External ❗️ |  💵 |NO❗️ |
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
| └ | decrementCopyIterations | External ❗️ |   |NO❗️ |
| └ | _decrementCopyIterations | Internal 🔒 |   | |
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
| └ | _defaultEncodedSettings | Internal 🔒 |   | |
| └ | depositHsi | External ❗️ |  💵 |NO❗️ |
| └ | _deposit721 | Internal 🔒 | 🛑  | |
| └ | hsiAddressToId | External ❗️ |   |NO❗️ |
| └ | _hsiAddressToId | Internal 🔒 |   | |
| └ | withdrawHsi | External ❗️ |  💵 |NO❗️ |
| └ | hsiCount | External ❗️ |   |NO❗️ |
| └ | _hsiCount | Internal 🔒 |   | |
| └ | _getStakeCount | Internal 🔒 |   | |
| └ | _withdraw721 | Internal 🔒 | 🛑  | |
| └ | hsiStakeEndMany | External ❗️ |  💵 |NO❗️ |
| └ | hsiStakeEndManyWithTipTo | External ❗️ |  💵 |NO❗️ |
| └ | _hsiStakeEndMany | Internal 🔒 | 🛑  | |
| └ | _getStakeInfo | Internal 🔒 |   | |
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
| └ | createIsolatedManager | External ❗️ |  💵 |NO❗️ |
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
| └ | setExternalPerpetualFilter | External ❗️ |  💵 |NO❗️ |
| └ | checkPerpetual | External ❗️ |  💵 |NO❗️ |
| └ | _checkPerpetual | Internal 🔒 | 🛑  | |
| └ | _addPerpetual | Internal 🔒 | 🛑  | |
| └ | stakeEndAs | External ❗️ |  💵 |NO❗️ |
| └ | _checkEndable | Internal 🔒 |   | |
| └ | checkEndable | External ❗️ |   |NO❗️ |
| └ | flush | External ❗️ |  💵 |NO❗️ |
||||||
| **MulticallExtension** | Implementation | Utils |||
| └ | multicall | External ❗️ | 🛑  |NO❗️ |
| └ | multicallWithDeadline | External ❗️ | 🛑  |NO❗️ |
| └ | multicallWithPreviousBlockHash | External ❗️ | 🛑  |NO❗️ |
| └ | _multicall | Internal 🔒 | 🛑  | |
||||||
| **SingletonCommunis** | Implementation | StakeEnder |||
| └ | mintCommunis | External ❗️ |  💵 |NO❗️ |
| └ | _encodePayoutInfo | Internal 🔒 |   | |
| └ | setFutureStakeEndCommunisAmount | External ❗️ |  💵 |NO❗️ |
| └ | _maxPayout | Internal 🔒 |   | |
| └ | _stakeAmountFromInputs | Internal 🔒 |   | |
| └ | _communisStakeEndBonus | Internal 🔒 | 🛑  | |
| └ | _verifyOnlyStaker | Internal 🔒 |   | |
| └ | withdrawAmountByStakeId | External ❗️ |  💵 |NO❗️ |
| └ | mintStakeBonus | External ❗️ |  💵 |NO❗️ |
| └ | _mintStakeBonus | Internal 🔒 | 🛑  | |
| └ | _attributeCommunis | Internal 🔒 | 🛑  | |
| └ | distributeStakeBonusByStakeId | External ❗️ |  💵 |NO❗️ |
| └ | claimStakeBonus | External ❗️ | 🛑  |NO❗️ |
| └ | _claimStakeBonus | Internal 🔒 | 🛑  | |
| └ | _attributeCommunis | Internal 🔒 | 🛑  | |
| └ | distributeStakeBonusByStakeId | External ❗️ |  💵 |NO❗️ |
||||||
| **SingletonMintManager** | Implementation | UnderlyingStakeManager |||
| └ | createTo | External ❗️ |   |NO❗️ |
| └ | _createTo | Internal 🔒 |   | |
| └ | mintHedronRewards | External ❗️ | 🛑  |NO❗️ |
| └ | _mintHedron | Internal 🔒 | 🛑  | |
| └ | _communisStakeEndBonus | Internal 🔒 | 🛑  | |
||||||
| **StakeEnder** | Implementation | Magnitude, SingletonMintManager |||
| └ | stakeEndByConsent | External ❗️ |  💵 |NO❗️ |
| └ | stakeEndByConsentWithTipTo | External ❗️ |  💵 |NO❗️ |
| └ | _stakeEndByConsentWithTipTo | Internal 🔒 | 🛑  | |
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
| **StakeManager** | Implementation | TransferableStakeManager |||
||||||
| **StakeStarter** | Implementation | SingletonCommunis |||
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
| └ | _getStakeInfo | Internal 🔒 |   | |
| └ | _stakeRestartById | Internal 🔒 | 🛑  | |
| └ | stakeRestartById | External ❗️ |  💵 |NO❗️ |
| └ | stakeRestartManyById | External ❗️ | 🛑  |NO❗️ |
||||||
| **UnderlyingStakeable** | Implementation | MulticallExtension, IUnderlyingStakeable |||
| └ | _getStake | Internal 🔒 |   | |
| └ | stakeCount | External ❗️ |   |NO❗️ |
| └ | _stakeCount | Internal 🔒 |   | |
| └ | _getStakeCount | Internal 🔒 |   | |
| └ | balanceOf | External ❗️ |   |NO❗️ |
| └ | _balanceOf | Internal 🔒 |   | |
| └ | stakeLists | External ❗️ |   |NO❗️ |
| └ | currentDay | External ❗️ |   |NO❗️ |
| └ | _currentDay | Internal 🔒 |   | |
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


