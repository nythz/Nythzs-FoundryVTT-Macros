// Token Selector/Targeter v2 by Nythz
// Menu to mass-select or target tokens based on choices of alliance and combat status
// Ignores Dead or Foundry "Hidden" Tokens
// Changelog:
// v2: added "Both" choice for the Alliance selection
//
let tokenActionDialog;
function performAction(action, alliance, scope) {
    switch (action) {
        case "select":
            handleSelectTokens(alliance, scope === "combat");
            break;
        case "target":
            handleTargetTokens(alliance, scope === "combat");
            break;
        case "clearSelection":
            clearSelection();
            break;
        case "clearTargets":
            clearTargets();
            break;
    }
}
async function handleSelectTokens(targetAlliance, inCombat) {
    await canvas.tokens.releaseAll();
    const tokens = canvas.tokens.placeables.filter(token => {
        const actor = token?.actor;
        if (!token?.document?.hidden && actor?.isOfType("creature", "hazard", "vehicle") && !actor.isDead && (targetAlliance === "both" || actor?.alliance === targetAlliance)) {
            if (inCombat) {
                return game.combat?.combatants.some(c => c.token?.id === token.id);
            }
            return true;
        }
        return false;
    });
    for (const token of tokens) {
        token.control({
            releaseOthers: false
        });
    }
    ui.notifications.info(`Selected ${tokens.length} ${targetAlliance === 'party' || targetAlliance === 'opposition' ? `${targetAlliance} ` : ''}tokens ${inCombat ? 'in combat' : 'on the scene'}.`);
}
async function handleTargetTokens(targetAlliance, inCombat) {
    let tokenIds = canvas.tokens.placeables.filter(token => {
        const actor = token?.actor;
        if (!token?.document?.hidden && actor?.isOfType("creature", "hazard", "vehicle") && !actor.isDead && (targetAlliance === "both" || actor?.alliance === targetAlliance)) {
            if (inCombat) {
                return game.combat?.combatants.some(c => c.token?.id === token.id);
            }
            return true;
        }
        return false;
    }).map(token => token.id);
    game.user.updateTokenTargets(tokenIds);
    ui.notifications.info(`Targeted ${tokenIds.length} ${targetAlliance === 'party' || targetAlliance === 'opposition' ? `${targetAlliance} ` : ''}tokens ${inCombat ? 'in combat' : 'on the scene'}.`);
}
async function clearSelection() {
    await canvas.tokens.releaseAll();
}
async function clearTargets() {
    await game.user.updateTokenTargets([]);
}
tokenActionDialog = await foundry.applications.api.DialogV2.wait({
    window: {
        title: "Token Selector/Targeter"
    },
    form: {
        closeOnSubmit: false
    },
    rejectClose: false,
    content: `
    <style>
      .toggle-button-container {
        display: flex;
        margin-top: -5px;
        margin-bottom: -5px;
        }
      .toggle-button {
        filter: brightness(0.7);
        gap: 5px;
      }
      .toggle-button.active {
        filter: brightness(1);
        }
    </style>
    <div class="toggle-button-container">
      <button type="button" class="toggle-button active" id="scene-button" data-value="scene"><i class="fas fa-map"></i> In Scene</button>
      <button type="button" class="toggle-button" id="combat-button" data-value="combat"><i class="fas fa-swords"></i> In Combat</button>
      <input type="hidden" id="scope" name="scope" value="scene">
    </div>
    <div class="toggle-button-container">
      <button type="button" class="toggle-button active" id="party-button" data-value="party"><i class="fas fa-users"></i> Party</button>
	  <button type="button" class="toggle-button" id="both-button" data-value="both"><i class="fas fa-project-diagram"></i> Both</button>
      <button type="button" class="toggle-button" id="opposition-button" data-value="opposition"><i class="fas fa-skull"></i> Opposition</button>
      <input type="hidden" id="target" name="target" value="party">
    </div>
  `,
    buttons: [{
        action: "select",
        label: "<i class='fas fa-check-square'></i> Select",
        callback: (event, button, dialog) => {
            const target = dialog.querySelector('#target').value;
            const scope = dialog.querySelector('#scope').value;
            handleSelectTokens(target, scope === "combat");
        }
    }, {
        action: "target",
        label: "<i class='fas fa-bullseye'></i> Target",
        callback: (event, button, dialog) => {
            const target = dialog.querySelector('#target').value;
            const scope = dialog.querySelector('#scope').value;
            handleTargetTokens(target, scope === "combat");
        }
    }, {
        action: "clearSelection",
        label: "<i class='fas fa-times-circle'></i> Clear Selection",
        callback: () => clearSelection()
    }, {
        action: "clearTargets",
        label: "<i class='fas fa-ban'></i> Clear Targets",
        callback: () => clearTargets()
    }],
    position: {
        width: "auto"
    },
    render: (_, html) => {
        const sceneButton = html.querySelector('#scene-button');
        const combatButton = html.querySelector('#combat-button');
        const partyButton = html.querySelector('#party-button');
        const bothButton = html.querySelector('#both-button');
        const oppositionButton = html.querySelector('#opposition-button');
        const scopeInput = html.querySelector('#scope');
        const targetInput = html.querySelector('#target');

        function setToggleButtonState(activeButton, inactiveButtons, value, hiddenInput) {
            activeButton.classList.add('active');
            activeButton.style.filter = 'brightness(1)';
            inactiveButtons.forEach(button => {
                button.classList.remove('active');
                button.style.filter = 'brightness(0.7)';
            });
            hiddenInput.value = value;
        }
        sceneButton.addEventListener('click', () => {
            setToggleButtonState(sceneButton, [combatButton], 'scene', scopeInput);
        });
        combatButton.addEventListener('click', () => {
            setToggleButtonState(combatButton, [sceneButton], 'combat', scopeInput);
        });
        partyButton.addEventListener('click', () => {
            setToggleButtonState(partyButton, [oppositionButton, bothButton], 'party', targetInput);
        });
        oppositionButton.addEventListener('click', () => {
            setToggleButtonState(oppositionButton, [partyButton, bothButton], 'opposition', targetInput);
        });
        bothButton.addEventListener('click', () => {
            setToggleButtonState(bothButton, [partyButton, oppositionButton], 'both', targetInput);
        });
        const buttonsContainer = html.querySelector(".form-footer");
        if (buttonsContainer) {
            buttonsContainer.style.display = "grid";
            buttonsContainer.style.gridTemplateColumns = "repeat(2, 1fr)";
            buttonsContainer.style.gap = "5px";
            buttonsContainer.style.flexWrap = "wrap";
        }
    }
});
