
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
| 📝 | ./contracts/Bank.sol | 1 | **** | 274 | 264 | 171 | 89 | 87 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/CurrencyList.sol | 1 | **** | 50 | 50 | 34 | 12 | 17 | **** |
| 📝 | ./contracts/EarningsOracle.sol | 1 | **** | 226 | 222 | 144 | 76 | 64 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 🎨 | ./contracts/EncodableSettings.sol | 1 | **** | 424 | 410 | 230 | 183 | 136 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/ExistingStakeManager.sol | 1 | **** | 7 | 7 | 3 | 2 | 3 | **** |
| 🎨 | ./contracts/GoodAccounting.sol | 1 | **** | 138 | 130 | 92 | 36 | 40 | **** |
| 📝 | ./contracts/HSIStakeManager.sol | 1 | **** | 257 | 246 | 166 | 78 | 98 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/IsolatedStakeManager.sol | 1 | **** | 254 | 254 | 155 | 97 | 96 | **<abbr title='Payable Functions'>💰</abbr>** |
| 📝 | ./contracts/IsolatedStakeManagerFactory.sol | 1 | **** | 27 | 27 | 18 | 7 | 21 | **<abbr title='Uses Hash-Functions'>🧮</abbr>** |
| 📝 | ./contracts/Magnitude.sol | 1 | **** | 240 | 208 | 124 | 93 | 68 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/MaximusStakeManager.sol | 1 | **** | 194 | 189 | 108 | 84 | 67 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/MulticallExtension.sol | 1 | **** | 101 | 90 | 59 | 29 | 25 | **<abbr title='DelegateCall'>👥</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/SingletonHedronManager.sol | 1 | **** | 82 | 82 | 74 | 6 | 30 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/StakeEnder.sol | 1 | **** | 290 | 280 | 246 | 32 | 92 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/StakeInfo.sol | 1 | **** | 137 | 137 | 51 | 84 | 35 | **** |
| 📝 | ./contracts/StakeManager.sol | 1 | **** | 9 | 9 | 6 | 1 | 6 | **** |
| 📝 | ./contracts/StakeStarter.sol | 1 | **** | 89 | 74 | 51 | 21 | 34 | **<abbr title='Payable Functions'>💰</abbr>** |
| 🎨 | ./contracts/Tipper.sol | 1 | **** | 490 | 446 | 365 | 82 | 156 | **<abbr title='Payable Functions'>💰</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/TransferrableStakeManager.sol | 1 | **** | 105 | 105 | 71 | 33 | 36 | **<abbr title='Payable Functions'>💰</abbr>** |
| 📝 | ./contracts/UnderlyingStakeManager.sol | 1 | **** | 191 | 184 | 115 | 67 | 56 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 🎨 | ./contracts/UnderlyingStakeable.sol | 1 | **** | 139 | 122 | 55 | 75 | 38 | **<abbr title='Unchecked Blocks'>Σ</abbr>** |
| 📝 | ./contracts/Utils.sol | 1 | **** | 51 | 51 | 41 | 9 | 82 | **<abbr title='Uses Assembly'>🖥</abbr>** |
| 📝🎨 | **Totals** | **23** | **** | **3889**  | **3701** | **2426** | **1261** | **1310** | **<abbr title='Uses Assembly'>🖥</abbr><abbr title='Payable Functions'>💰</abbr><abbr title='DelegateCall'>👥</abbr><abbr title='Uses Hash-Functions'>🧮</abbr><abbr title='Unchecked Blocks'>Σ</abbr>** |

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

- **Comment-to-Source Ratio:** On average there are`2.07` code lines per comment (lower=better).
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
| 105 | 188  | 0 | 45 | 52 |

#### <span id=t-statevariables>StateVariables</span>

| Total      | 🌐Public  |
| ---------- | --------- |
| 77  | 25 |

#### <span id=t-capabilities>Capabilities</span>

| Solidity Versions observed | 🧪 Experimental Features | 💰 Can Receive Funds | 🖥 Uses Assembly | 💣 Has Destroyable Contracts | 
| -------------------------- | ------------------------ | -------------------- | ---------------- | ---------------------------- |
| `>=0.8.18` |  | `yes` | `yes` <br/>(1 asm blocks) | **** | 

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
| ./contracts/AuthorizationManager.sol | a8dc212dede252429e74eee0121882c5a852ea7a |
| ./contracts/Bank.sol | a2327bdb4f5563dbf66842ff5bd418b4c587a76b |
| ./contracts/CurrencyList.sol | 39e65aa7b67761740712e753eeb8c564b4a8870c |
| ./contracts/EarningsOracle.sol | 71b211a462761ac085df9eae072e7cf6c28dd040 |
| ./contracts/EncodableSettings.sol | d9311a490c4b7d390d3deaaaf9f9bf8682108942 |
| ./contracts/ExistingStakeManager.sol | 22598533afb3b31b1f25f19b6a004ecd7714c143 |
| ./contracts/GoodAccounting.sol | ab772f60ba2a25e012dc3b24b58d63f339869b90 |
| ./contracts/HSIStakeManager.sol | 217ea7f655bf92246c50e1f8500bad6374f93bfa |
| ./contracts/IsolatedStakeManager.sol | 66f215ebe1bbcddb637852d2fed7aec3b546f50e |
| ./contracts/IsolatedStakeManagerFactory.sol | e273ea4a137a3d45059858b70f91780443a02301 |
| ./contracts/Magnitude.sol | 148ff6a036ec0a6c957a62531a5805b988c295c0 |
| ./contracts/MaximusStakeManager.sol | 5944edc34f34df7531cb910368bd84b82ce25af5 |
| ./contracts/MulticallExtension.sol | 9f4e38e9228e1583e320561d55d9b0407d2e841c |
| ./contracts/SingletonHedronManager.sol | 39bb6b0d73c9e579f7c000bac2918ce3e88a0949 |
| ./contracts/StakeEnder.sol | ea7e1205f2924a9987a22f085a5b111e43718ffa |
| ./contracts/StakeInfo.sol | eaa02c41fa02bbcaa3514a25d251a193396ba57d |
| ./contracts/StakeManager.sol | 1677faef1eae4b192bf7a48ceebe84a14fd60fd6 |
| ./contracts/StakeStarter.sol | 7d4a2a122fbfd0a4c9bf08a797df4134a03d269f |
| ./contracts/Tipper.sol | bc2dcecd8f20047a6b7c3ca4cb5ea0d458e4ec52 |
| ./contracts/TransferrableStakeManager.sol | 2ea693a66e8f47e6b182930433730ef2839e3988 |
| ./contracts/UnderlyingStakeManager.sol | 88d7cad07404d6e87f313a69ebe4ed28de641677 |
| ./contracts/UnderlyingStakeable.sol | 62df4b2dfc1a54f7e8cdff100d41e00b505d5225 |
| ./contracts/Utils.sol | 6a8618af86b2e82404c4b3d9667f9b1f5d14432b |


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
| └ | payoutDeltaTrucated | External ❗️ |   |NO❗️ |
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
| **GoodAccounting** | Implementation | StakeInfo, Tipper |||
| └ | checkStakeGoodAccounting | External ❗️ | 🛑  |NO❗️ |
| └ | checkStakeGoodAccountingFor | External ❗️ | 🛑  |NO❗️ |
| └ | isGoodAccountable | External ❗️ |   |NO❗️ |
| └ | isStakeIdGoodAccountable | External ❗️ |   |NO❗️ |
| └ | _isGoodAccountable | Internal 🔒 |   | |
| └ | _checkStakeGoodAccounting | Internal 🔒 | 🛑  | |
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
| └ | _yDeltas | Internal 🔒 |   | |
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
| **StakeManager** | Implementation | TransferrableStakeManager, EarningsOracle |||
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
| └ | _executeTipList | Internal 🔒 | 🛑  | |
| └ | encodeTipSettings | External ❗️ |   |NO❗️ |
| └ | encodedLinearWithMethod | External ❗️ |   |NO❗️ |
| └ | _encodeTipSettings | Internal 🔒 |   | |
| └ | depositAndAddTipToStake | External ❗️ |  💵 |NO❗️ |
| └ | removeAllTips | External ❗️ | 🛑  |NO❗️ |
| └ | _removeAllTips | Internal 🔒 | 🛑  | |
| └ | removeTipsFromStake | External ❗️ |  💵 |NO❗️ |
| └ | _removeTipsFromStake | Internal 🔒 | 🛑  | |
| └ | addTipToStake | External ❗️ |  💵 |NO❗️ |
| └ | _verifyTipAmountAllowed | Internal 🔒 |   | |
| └ | _checkStakeCustodian | Internal 🔒 |   | |
| └ | _transferTipLock | Internal 🔒 | 🛑  | |
| └ | _addTipToStake | Internal 🔒 | 🛑  | |
| └ | <Receive Ether> | External ❗️ |  💵 |NO❗️ |
||||||
| **TransferrableStakeManager** | Implementation | StakeStarter |||
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


