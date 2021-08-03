import {
  diceRoller,
  payPoolPoints,
  itemRollMacroQuick
} from "./macro-helper.js";
import {
  allInOneRollDialogString,
  spendEffortString
} from "./macro-strings.js";
import {
  chatCardProposeIntrusion,
  chatCardAskForIntrusion
} from "../chat-cards.js";

/* -------------------------------------------- */
/*  Roll Macros                                 */
/* -------------------------------------------- */

export function quickRollMacro(title) {
  diceRoller(game.i18n.localize("CYPHERSYSTEM.StatRoll"), "", 0, 0)
}

export function easedRollMacro() {
  let d = new Dialog({
    title: game.i18n.localize("CYPHERSYSTEM.EasedStatRoll"),
    content: `<div align="center"><label style='display: inline-block; text-align: right'><b>${game.i18n.localize("CYPHERSYSTEM.EasedBy")}: </b></label>
    <input style='width: 50px; margin-left: 5px; margin-bottom: 5px;text-align: center' type='text' value=1 data-dtype='Number'/></div>`,
    buttons: {
      roll: {
        icon: '<i class="fas fa-dice-d20"></i>',
        label: game.i18n.localize("CYPHERSYSTEM.Roll"),
        callback: (html) => diceRoller(game.i18n.localize("CYPHERSYSTEM.StatRoll"), "", html.find('input').val(), 0)
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("CYPHERSYSTEM.Cancel"),
        callback: () => { }
      }
    },
    default: "roll",
    close: () => { }
  });
  d.render(true);
}

export function hinderedRollMacro() {
  let d = new Dialog({
    title: game.i18n.localize("CYPHERSYSTEM.HinderedStatRoll"),
    content: `<div align="center"><label style='display: inline-block; text-align: right'><b>${game.i18n.localize("CYPHERSYSTEM.HinderedBy")}: </b></label>
    <input style='width: 50px; margin-left: 5px; margin-bottom: 5px;text-align: center' type='text' value=1 data-dtype='Number'/></div>`,
    buttons: {
      roll: {
        icon: '<i class="fas fa-dice-d20"></i>',
        label: game.i18n.localize("CYPHERSYSTEM.Roll"),
        callback: (html) => diceRoller(game.i18n.localize("CYPHERSYSTEM.StatRoll"), "", html.find('input').val()*-1, 0)
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("CYPHERSYSTEM.Cancel"),
        callback: () => { }
      }
    },
    default: "roll",
    close: () => { }
  });
  d.render(true);
}

export async function diceRollMacro(dice) {
  // Check whether the dice formula is "1dX" or "dX" to assure that both ways work
  if (dice.charAt(0) == "d") dice = "1" + dice;

  // Roll dice
  const roll = await new Roll(dice).evaluate({async: false});

  // Add reroll button
  let reRollButton = `<div style='text-align: right'><a class='reroll-dice-roll' data-dice='${dice}' data-user='${game.user.id}'><i class="fas fa-redo"></i> ${game.i18n.localize("CYPHERSYSTEM.Reroll")}</a></div>`

  // Send chat message
  roll.toMessage({
    speaker: ChatMessage.getSpeaker(),
    flavor: "<b>" + dice + " " + game.i18n.localize("CYPHERSYSTEM.Roll") + "</b>" + reRollButton
  });
}

export async function allInOneRollMacro(actor, title, info, cost, pool, modifier, teen) {
  // Check for PC actor
  if (!actor || actor.data.type != "PC") return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.MacroOnlyAppliesToPC"));

  // Check for debilitated status
  if (actor.data.data.damage.damageTrack == "Debilitated") return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.DebilitatedPCEffort"))

  // Pay pool points
  const pointsPaid = await payPoolPoints(actor, cost, pool, teen);

  // If points are paid, roll dice
  if (pointsPaid) diceRoller(title, info, modifier);
}

export function allInOneRollDialog(actor, pool, skill, assets, effort1, effort2, additionalCost, additionalSteps, stepModifier, title, damage, effort3, damagePerLOE, teen, skipDialog) {
  // Check for PC actor
  if (!actor || actor.data.type != "PC") return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.MacroOnlyAppliesToPC"));

  // Check for debilitated status
  if (actor.data.data.damage.damageTrack == "Debilitated") return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.DebilitatedPCEffort"));

  // Check whether pool == XP
  if (pool == "XP" && !skipDialog) return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.CantUseAIOMacroWithAbilitiesUsingXP"));

  // Set defaults for teen
  if (!teen) teen = (actor.data.data.settings.gameMode.currentSheet == "Teen") ? true : false;

  // Set defaults for damage and damagePerLOE
  if (!damage) damage = 0;
  if (!damagePerLOE) damagePerLOE = 3;

  // Create All-in-One dialog
  let d = new Dialog({
    title: game.i18n.localize("CYPHERSYSTEM.AllInOneRoll"),
    content: allInOneRollDialogString(actor, pool, skill, assets, effort1, effort2, additionalCost, additionalSteps, stepModifier, title, damage, effort3, damagePerLOE, teen),
    buttons: {
      roll: {
        icon: '<i class="fas fa-dice-d20"></i>',
        label: game.i18n.localize("CYPHERSYSTEM.Roll"),
        callback: (html) => {
          applyToMacro(html.find('#pool').val(), html.find('#skill').val(), html.find('#assets').val(), html.find('#effort1').val(), html.find('#effort2').val(), html.find('#additionalCost').val(), html.find('#additionalSteps').val(), html.find('#stepModifier').val(), title, html.find('#damage').val(), html.find('#effort3').val(), html.find('#damagePerLOE').val(), teen, skipDialog);
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("CYPHERSYSTEM.Cancel"),
        callback: () => { }
      }
    },
    default: "roll",
    close: () => { }
  });

  // Skip dialog?
  (!skipDialog) ? d.render(true) : applyToMacro(pool, skill, assets, effort1, effort2, additionalCost, additionalSteps, stepModifier, title, damage, effort3, damagePerLOE, teen, skipDialog);

  // Prepare data and parse to allInOneRollMacro
  function applyToMacro(pool, skill, assets, effort1, effort2, additionalCost, additionalSteps, stepModifier, title, damage, effort3, damagePerLOE, teen, skipDialog) {
    // Title information
    let poolRoll = {
      "Might": game.i18n.localize("CYPHERSYSTEM.MightRoll"),
      "Speed": game.i18n.localize("CYPHERSYSTEM.SpeedRoll"),
      "Intellect": game.i18n.localize("CYPHERSYSTEM.IntellectRoll"),
      "Pool": game.i18n.localize("CYPHERSYSTEM.StatRoll")
    };
    title = (title == "") ? (poolRoll[pool] || poolRoll["Might"]) : title;

    // Fallback for strings in skill
    if (skill == "Specialized") skill = 2;
    if (skill == "Trained") skill = 1;
    if (skill == "Practiced") skill = 0;
    if (skill == "Inability") skill = -1;

    // Skill information
    let skillRating = {
      "-1": `${game.i18n.localize("CYPHERSYSTEM.SkillLevel")}: ${game.i18n.localize("CYPHERSYSTEM.Inability")}<br>`,
      "0": `${game.i18n.localize("CYPHERSYSTEM.SkillLevel")}: ${game.i18n.localize("CYPHERSYSTEM.Practiced")}<br>`,
      "1": `${game.i18n.localize("CYPHERSYSTEM.SkillLevel")}: ${game.i18n.localize("CYPHERSYSTEM.Trained")}<br>`,
      "2": `${game.i18n.localize("CYPHERSYSTEM.SkillLevel")}: ${game.i18n.localize("CYPHERSYSTEM.Specialized")}<br>`
    };
    let skillInfo = (skillRating[skill] || skillRating[0]);

    // Asset information
    let assetInfo = `${game.i18n.localize("CYPHERSYSTEM.Assets")}: ${assets}<br>`;

    // Point(s) cost information
    let costInfo = "";

    // -- Effort verification
    let effort = parseInt(effort1) + parseInt(effort2) + parseInt(effort3);

    if (effort > actor.data.data.basic.effort) {
      if (!skipDialog) allInOneRollDialog(actor, pool, skillRating, assets, effort1, effort2, additionalCost, additionalSteps, stepModifier);
      return ui.notifications.notify(game.i18n.localize("CYPHERSYSTEM.SpendTooMuchEffort"));
    };

    // -- Cost calculation
    let impaired = (actor.data.data.damage.damageTrack == "Impaired") ? effort : 0;
    let armorCost = (pool == "Speed") ? parseInt(effort) * parseInt(actor.data.data.armor.speedCostTotal) : 0;
    let cost = (effort > 0) ? (effort * 2) + 1 + parseInt(additionalCost) + parseInt(armorCost) + parseInt(impaired) : parseInt(additionalCost);

    let mightEdge = (teen) ? actor.data.data.teen.pools.mightEdge : actor.data.data.pools.mightEdge;
    let speedEdge = (teen) ? actor.data.data.teen.pools.speedEdge : actor.data.data.pools.speedEdge;
    let intellectEdge = (teen) ? actor.data.data.teen.pools.intellectEdge : actor.data.data.pools.intellectEdge;

    let edgeType = {
      "Might": mightEdge,
      "Speed": speedEdge,
      "Intellect": intellectEdge
    };
    let edge = (edgeType[pool] || 0);
    edge = (edge < 0 && (cost == 0 || cost == "")) ? 0 : edge;

    let totalCost = (cost > edge) ? cost - edge : 0;

    // -- Cost verification
    let mightValue = (teen) ? actor.data.data.teen.pools.might.value : actor.data.data.pools.might.value;
    let speedValue = (teen) ? actor.data.data.teen.pools.speed.value : actor.data.data.pools.speed.value;
    let intellectValue = (teen) ? actor.data.data.teen.pools.intellect.value : actor.data.data.pools.intellect.value;

    let poolVerification = {
      "Might": function () { return (totalCost > mightValue) ? false : true; },
      "Speed": function () { return (totalCost > speedValue) ? false : true; },
      "Intellect": function () { return (totalCost > intellectValue) ? false : true; },
      "Pool": function () { return (totalCost > (mightValue + speedValue + intellectValue)) ? false : true; },
      "XP": function () { return (totalCost > actor.data.data.basic.xp) ? false : true; },
    };

    // -- Information total cost
    let totalCostInfo = {
      "Might": function () {
        return (totalCost != 1) ?
        `${game.i18n.localize("CYPHERSYSTEM.TotalCost")}: ${totalCost} (${cost}-${edge})  ${game.i18n.localize("CYPHERSYSTEM.MightPoints")}` :
        `${game.i18n.localize("CYPHERSYSTEM.TotalCost")}: ${totalCost} (${cost}-${edge})  ${game.i18n.localize("CYPHERSYSTEM.MightPoint")}`;
      },
      "Speed": function () {
        return (totalCost != 1) ?
        `${game.i18n.localize("CYPHERSYSTEM.TotalCost")}: ${totalCost} (${cost}-${edge})  ${game.i18n.localize("CYPHERSYSTEM.SpeedPoints")}` :
        `${game.i18n.localize("CYPHERSYSTEM.TotalCost")}: ${totalCost} (${cost}-${edge})  ${game.i18n.localize("CYPHERSYSTEM.SpeedPoint")}`;
      },
      "Intellect": function () {
        return (totalCost != 1) ?
        `${game.i18n.localize("CYPHERSYSTEM.TotalCost")}: ${totalCost} (${cost}-${edge})  ${game.i18n.localize("CYPHERSYSTEM.IntellectPoints")}` :
        `${game.i18n.localize("CYPHERSYSTEM.TotalCost")}: ${totalCost} (${cost}-${edge})  ${game.i18n.localize("CYPHERSYSTEM.IntellectPoint")}`;
      },
      "Pool": function () {
        return (totalCost != 1) ?
        `${game.i18n.localize("CYPHERSYSTEM.TotalCost")}: ${totalCost}  ${game.i18n.localize("CYPHERSYSTEM.AnyPoolPoints")}` :
        `${game.i18n.localize("CYPHERSYSTEM.TotalCost")}: ${totalCost}  ${game.i18n.localize("CYPHERSYSTEM.AnyPoolPoint")}`;
      },
      "XP": function () {
        return `${game.i18n.localize("CYPHERSYSTEM.TotalCost")}: ${totalCost} ${game.i18n.localize("CYPHERSYSTEM.XP")}`
      }
    }

    // -- Information pool cost
    let poolCostInfo = {
      "Might": function () {
        return (additionalCost != 1) ?
        `${game.i18n.localize("CYPHERSYSTEM.Cost")}: ${additionalCost}  ${game.i18n.localize("CYPHERSYSTEM.MightPoints")}` :
        `${game.i18n.localize("CYPHERSYSTEM.Cost")}: ${additionalCost}  ${game.i18n.localize("CYPHERSYSTEM.MightPoint")}`;
      },
      "Speed": function () {
        return (additionalCost != 1) ?
        `${game.i18n.localize("CYPHERSYSTEM.Cost")}: ${additionalCost}  ${game.i18n.localize("CYPHERSYSTEM.SpeedPoints")}` :
        `${game.i18n.localize("CYPHERSYSTEM.Cost")}: ${additionalCost}  ${game.i18n.localize("CYPHERSYSTEM.SpeedPoint")}`;
      },
      "Intellect": function () {
        return (additionalCost != 1) ?
        `${game.i18n.localize("CYPHERSYSTEM.Cost")}: ${additionalCost}  ${game.i18n.localize("CYPHERSYSTEM.IntellectPoints")}` :
        `${game.i18n.localize("CYPHERSYSTEM.Cost")}: ${additionalCost}  ${game.i18n.localize("CYPHERSYSTEM.IntellectPoint")}`;
      },
      "Pool": function () {
        return (additionalCost != 1) ?
        `${game.i18n.localize("CYPHERSYSTEM.Cost")}: ${additionalCost}  ${game.i18n.localize("CYPHERSYSTEM.AnyPoolPoints")}` :
        `${game.i18n.localize("CYPHERSYSTEM.Cost")}: ${additionalCost}  ${game.i18n.localize("CYPHERSYSTEM.AnyPoolPoint")}`;
      },
      "XP": function () {
        return `${game.i18n.localize("CYPHERSYSTEM.Cost")}: ${additionalCost}  ${game.i18n.localize("CYPHERSYSTEM.XP")}`
      }
    }

    if (poolVerification[pool]()) {
      costInfo = poolCostInfo[pool]() + "<br>" + totalCostInfo[pool]();
    } else {
      if (!skipDialog) allInOneRollDialog(actor, pool, skillRating, assets, effort1, effort2, additionalCost, additionalSteps, stepModifier, teen, skipDialog);
      if (pool == "XP") {
        return ui.notifications.notify(game.i18n.localize("CYPHERSYSTEM.NotEnoughXP"))
      } else {
        return ui.notifications.warn(game.i18n.format("CYPHERSYSTEM.NotEnoughPoint", {pool: pool}));
      }
    }

    // Effort to ease the task information
    let effortTaskInfo = (effort1 != 1) ?
    `${game.i18n.localize("CYPHERSYSTEM.EffortForTask")}: ${effort1} ${game.i18n.localize("CYPHERSYSTEM.levels")}<br>` :
    `${game.i18n.localize("CYPHERSYSTEM.EffortForTask")}: ${effort1} ${game.i18n.localize("CYPHERSYSTEM.level")}<br>`;

    // Effort for other use information
    let effortOtherInfo = (effort2 != 1) ?
    `${game.i18n.localize("CYPHERSYSTEM.EffortForOther")}: ${effort2} ${game.i18n.localize("CYPHERSYSTEM.levels")}<br>` :
    `${game.i18n.localize("CYPHERSYSTEM.EffortForOther")}: ${effort2} ${game.i18n.localize("CYPHERSYSTEM.level")}<br>`;

    // Damage information
    let damageEffort = parseInt(damagePerLOE) * parseInt(effort3);
    let totalDamage = parseInt(damage) + parseInt(damageEffort);
    let damageInfo = `${game.i18n.localize("CYPHERSYSTEM.Damage")}: ${totalDamage} (${damage}+${damageEffort})<hr style=\"margin-top: 1px; margin-bottom: 2px;\">`;

    // Attack modifier information
    let attackModifierInfo = "<hr style=\"margin-top: 1px; margin-bottom: 2px;\">";
    if (damage > 0 || effort3 > 0) {
      if (effort3 != 1) {
        attackModifierInfo = `<hr style=\"margin-top: 1px; margin-bottom: 2px;\">${game.i18n.localize("CYPHERSYSTEM.EffortForDamage")}: ${effort3} ${game.i18n.localize("CYPHERSYSTEM.levels")}<br>${damageInfo}`;
      } else {
        attackModifierInfo = `<hr style=\"margin-top: 1px; margin-bottom: 2px;\">${game.i18n.localize("CYPHERSYSTEM.EffortForDamage")}: ${effort3} ${game.i18n.localize("CYPHERSYSTEM.level")}<br>${damageInfo}`
      }
    }

    // Additional step(s) information
    additionalSteps = parseInt(additionalSteps);

    let additionalInfo = "";
    if (stepModifier != "hindered") {
      if (additionalSteps > 1) {
        additionalInfo = `${game.i18n.format("CYPHERSYSTEM.EasedByExtraSteps", {amount: additionalSteps})}<br>`;
      } else if (additionalSteps == 1) {
        additionalInfo = `${game.i18n.localize("CYPHERSYSTEM.EasedByExtraStep")}<br>`;
      }
    } else {
      if (additionalSteps > 1) {
        additionalInfo = `${game.i18n.format("CYPHERSYSTEM.HinderedByExtraSteps", {amount: additionalSteps})}<br>`;
      } else if (additionalSteps == 1) {
        additionalInfo = `${game.i18n.localize("CYPHERSYSTEM.HinderedByExtraStep")}<br>`;
      }
      additionalSteps = additionalSteps * -1;
    }

    // Put it all together for info
    let info = skillInfo + assetInfo + effortTaskInfo + effortOtherInfo + attackModifierInfo + additionalInfo + costInfo;

    // Put it all together for total modifier
    let modifier = parseInt(skill) + parseInt(assets) + parseInt(effort1) + parseInt(additionalSteps);

    // Parse everything to allInOneRollMacro
    allInOneRollMacro(actor, title, info, cost, pool, modifier, teen);
  }
}

export function itemRollMacro(actor, itemID, pool, skill, assets, effort1, effort2, additionalSteps, additionalCost, damage, effort3, damagePerLOE, teen, stepModifier) {
  // Find actor based on item ID
  const owner = game.actors.find(actor => actor.items.get(itemID));

  // Check for actor that owns the item
  if (!actor || actor.data.type != "PC") return ui.notifications.warn(game.i18n.format("CYPHERSYSTEM.MacroOnlyUsedBy", {name: owner.name}));

  // Determine the item based on item ID
  const item = actor.items.get(itemID);

  // Check whether the item still exists on the actor
  if (item == null) return ui.notifications.warn(game.i18n.format("CYPHERSYSTEM.MacroOnlyUsedBy", {name: owner.name}));

  // Check for AiO dialog
  let skipDialog = true;
  if ((game.settings.get("cyphersystem", "itemMacrosUseAllInOne") && !event.altKey) || (!game.settings.get("cyphersystem", "itemMacrosUseAllInOne") && event.altKey)) {
    skipDialog = false;
  };

  // Prepare data
  // Prepare defaults in case none are set by users in the macro
  if (!skill) {
    if (item.type == "skill" || item.type == "teen Skill") {
      skill = item.data.data.skillLevel;
    } else if (item.type == "attack" || item.type == "teen Attack") {
      skill = item.data.data.skillRating;
    } else {
      skill = item.item.data.rollButton.skill;
    }
  }
  if (!assets) assets = item.data.data.rollButton.assets;;
  if (!effort1) effort1 = item.data.data.rollButton.effort1;
  if (!effort2) effort2 = item.data.data.rollButton.effort2;
  if (!effort3) effort3 = item.data.data.rollButton.effort3;
  if (!additionalCost) {
    if (item.type == "ability"  || item.type == "teen Ability") {
      let checkPlus = item.data.data.costPoints.slice(-1)
      if (checkPlus == "+") {
        let cost = item.data.data.costPoints.slice(0, -1);
        additionalCost = parseInt(cost);
      } else {
        let cost = item.data.data.costPoints;
        additionalCost = parseInt(cost);
      }
    } else {
      additionalCost = item.data.data.rollButton.additionalCost;
    }
  }
  if (!additionalSteps) {
    if (item.type == "power Shift") {
      additionalSteps = item.data.data.powerShiftValue;
    } else if (item.type == "attack" || item.type == "teen Attack") {
      additionalSteps = item.data.data.modifiedBy;
    } else {
      additionalSteps = item.data.data.rollButton.additionalSteps;
    }
  }
  if (!damage) {
    if (item.type == "attack" || item.type == "teen Attack") {
      damage = item.data.data.damage;
    } else {
      damage = item.data.data.rollButton.damage;
    }
  }
  if (!pool) {
    if (item.type == "ability"  || item.type == "teen Ability") {
      pool = item.data.data.costPool;
    } else {
      pool = item.data.data.rollButton.pool;
    }
  }
  if (!damagePerLOE) damagePerLOE = item.data.data.rollButton.damagePerLOE;
  if (!stepModifier) {
    if (item.type == "attack" || item.type == "teen Attack") {
      stepModifier = item.data.data.modified;
    } else {
      stepModifier = (additionalSteps < 0) ? "hindered" : "eased";
    }
  }
  if (!teen) teen = (actor.data.data.settings.gameMode.currentSheet == "Teen") ? true : false;

  // // Overwrite defaults for some item types
  // if (item.type == "skill" || item.type == "teen Skill") {
  //   skill = item.data.data.skillLevel;
  // } else if (item.type == "attack" || item.type == "teen Attack") {
  //   skill = item.data.data.skillRating;
  //   additionalSteps = item.data.data.modifiedBy;
  //   stepModifier = item.data.data.modified;
  //   damage = item.data.data.damage;
  // } else if (item.type == "ability"  || item.type == "teen Ability") {
  //   pool = item.data.data.costPool;
  //   let checkPlus = item.data.data.costPoints.slice(-1)
  //   if (checkPlus == "+") {
  //     let cost = item.data.data.costPoints.slice(0, -1);
  //     additionalCost = parseInt(cost);
  //   } else {
  //     let cost = item.data.data.costPoints;
  //     additionalCost = parseInt(cost);
  //   }
  // } else if (item.type == "power Shift") {
  //   additionalSteps = item.data.data.powerShiftValue;
  // }

  // Parse data to All-in-One Dialog
  allInOneRollDialog(actor, pool, skill, assets, effort1, effort2, additionalCost, Math.abs(additionalSteps), stepModifier, item.name, damage, effort3, damagePerLOE, teen, skipDialog)
}

/* -------------------------------------------- */
/*  Utility Macros                              */
/* -------------------------------------------- */

export async function recoveryRollMacro(actor, dice) {
  // Check for dice
  if (!dice) {
    // Check for PC actor
    if (!actor || actor.data.type != "PC") return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.MacroOnlyAppliesToPC"));

    // Define dice
    dice = actor.data.data.recoveries.recoveryRoll;
  }

  // Roll recovery roll
  let roll = await new Roll(dice).evaluate({async: true});

  // Add reroll button
  let reRollButton = `<div style='text-align: right'><a class='reroll-recovery' data-dice='${dice}' data-user='${game.user.id}'><i class="fas fa-redo"></i> ${game.i18n.localize("CYPHERSYSTEM.Reroll")}</a></div>`

  // Send chat message
  roll.toMessage({
    speaker: ChatMessage.getSpeaker(),
    flavor: "<b>" + game.i18n.localize("CYPHERSYSTEM.RecoveryRoll") + "</b>" + reRollButton
  });
}

export function spendEffortMacro(actor) {
  // Check for PC actor
  if (!actor || actor.data.type != "PC") return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.MacroOnlyAppliesToPC"));

  // Check for debilitated status
  if (actor.data.data.damage.damageTrack == "Debilitated") return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.DebilitatedPCEffort"));

  // Create dialog
  let d = new Dialog({
    title: game.i18n.localize("CYPHERSYSTEM.SpendEffort"),
    content: spendEffortString(),
    buttons: {
      roll: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize("CYPHERSYSTEM.Apply"),
        callback: (html) => applyToPool(html.find('select').val(), html.find('input').val())
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("CYPHERSYSTEM.Cancel"),
        callback: () => { }
      }
    },
    default: "roll",
    close: () => { }
  });
  d.render(true);

  // Apply points to pools
  function applyToPool(pool, level) {
    // Set penalty when impaired
    let penalty = (actor.data.data.damage.damageTrack == "Impaired") ? level : 0;

    // Determine point cost including penalty due to armor
    let cost = (pool == "Speed") ?
    (level * 2) + 1 + (level * actor.data.data.armor.speedCostTotal) + parseInt(penalty) :
    (level * 2) + 1 + parseInt(penalty);

    // Pay pool points
    payPoolPoints(actor, cost, pool);
  }
}

export function toggleDragRuler(token) {
  if (!game.modules.get("drag-ruler").active) return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.ActivateDragRuler"));
  if (!token) {
    return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.SelectAToken"))
  }

  if (!token.document.data.flags.cyphersystem.toggleDragRuler) {
    token.document.setFlag("cyphersystem", "toggleDragRuler", true);
    ui.notifications.info(game.i18n.format("CYPHERSYSTEM.EnabledDragRuler", {name: token.name}));
  } else if (token.document.data.flags.cyphersystem.toggleDragRuler) {
    token.document.setFlag("cyphersystem", "toggleDragRuler", false);
    ui.notifications.info(game.i18n.format("CYPHERSYSTEM.DisabledDragRuler", {name: token.name}));
  }
}

export function resetDragRulerDefaults() {
  if (!game.modules.get("drag-ruler").active) return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.ActivateDragRuler"));
  for (let token of canvas.tokens.objects.children) {
    if (token.actor.data.type !== "Token" && token.actor.data.type !== "Vehicle") {
      token.document.setFlag("cyphersystem", "toggleDragRuler", true);
    } else {
      token.document.setFlag("cyphersystem", "toggleDragRuler", false);
    }
  }
  ui.notifications.info(game.i18n.localize("CYPHERSYSTEM.AllTokenDragRuler"));
}

export function resetBarBrawlDefaults() {
  if (!game.modules.get("barbrawl").active) return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.ActivateBarBrawl"));
  for (let token of canvas.tokens.objects.children) {
    if (token.actor.data.type === "PC") {
      token.document.setFlag("barbrawl", "resourceBars", {
        "bar1": {
          id: "bar1",
          mincolor: "#0000FF",
          maxcolor: "#0000FF",
          position: "bottom-inner",
          attribute: "pools.intellect",
          visibility: CONST.TOKEN_DISPLAY_MODES.OWNER
        },
        "bar2": {
          id: "bar2",
          mincolor: "#00FF00",
          maxcolor: "#00FF00",
          position: "bottom-inner",
          attribute: "pools.speed",
          visibility: CONST.TOKEN_DISPLAY_MODES.OWNER
        },
        "bar3": {
          id: "bar3",
          mincolor: "#FF0000",
          maxcolor: "#FF0000",
          position: "bottom-inner",
          attribute: "pools.might",
          visibility: CONST.TOKEN_DISPLAY_MODES.OWNER
        }
      })
    } else if (token.actor.data.type === "NPC" || token.actor.data.type === "Companion") {
      token.document.setFlag("barbrawl", "resourceBars", {
        "bar1": {
          id: "bar1",
          mincolor: "#0000FF",
          maxcolor: "#0000FF",
          position: "top-inner",
          attribute: "level",
          visibility: CONST.TOKEN_DISPLAY_MODES.OWNER
        },
        "bar2": {
          id: "bar2",
          mincolor: "#FF0000",
          maxcolor: "#FF0000",
          position: "bottom-inner",
          attribute: "health",
          visibility: CONST.TOKEN_DISPLAY_MODES.OWNER
        }
      })
    } else if (token.actor.data.type === "Community") {
      token.document.setFlag("barbrawl", "resourceBars", {
        "bar1": {
          id: "bar1",
          mincolor: "#0000FF",
          maxcolor: "#0000FF",
          position: "top-inner",
          attribute: "rank",
          visibility: CONST.TOKEN_DISPLAY_MODES.OWNER
        },
        "bar2": {
          id: "bar2",
          mincolor: "#0000FF",
          maxcolor: "#0000FF",
          position: "bottom-inner",
          attribute: "infrastructure",
          visibility: CONST.TOKEN_DISPLAY_MODES.OWNER
        },
        "bar3": {
          id: "bar3",
          mincolor: "#FF0000",
          maxcolor: "#FF0000",
          position: "bottom-inner",
          attribute: "health",
          visibility: CONST.TOKEN_DISPLAY_MODES.OWNER
        }
      })
    } else if (token.actor.data.type === "Token") {
      token.document.setFlag("barbrawl", "resourceBars", {
        "bar1": {
          id: "bar1",
          mincolor: "#0000FF",
          maxcolor: "#0000FF",
          position: "top-inner",
          attribute: "level",
          visibility: CONST.TOKEN_DISPLAY_MODES.OWNER
        },
        "bar2": {
          id: "bar2",
          mincolor: "#FF0000",
          maxcolor: "#FF0000",
          position: "bottom-inner",
          attribute: "quantity",
          visibility: CONST.TOKEN_DISPLAY_MODES.ALWAYS
        }
      })
    }
  }
}

export function quickStatChange(token, stat, modifier) {
  // Make sure stat is case-insensitive
  stat = stat.toLowerCase();

  // Declare variable
  let statData;

  // Get stat data
  switch(stat) {
    case "xp":
    if (!checkToken(["PC"], game.i18n.localize("CYPHERSYSTEM.XP"))) return;
    statData = calculateStatData(token.actor.data.data.basic.xp);
    token.actor.update({"data.basic.xp": statData});
    break;
    case "might":
    if (!checkToken(["PC"], game.i18n.localize("CYPHERSYSTEM.Might"))) return;
    statData = calculateStatData(token.actor.data.data.pools.might.value);
    token.actor.update({"data.pools.might.value": statData});
    break;
    case "speed":
    if (!checkToken(["PC"], game.i18n.localize("CYPHERSYSTEM.Speed"))) return;
    statData = calculateStatData(token.actor.data.data.pools.speed.value);
    token.actor.update({"data.pools.speed.value": statData});
    break;
    case "intellect":
    if (!checkToken(["PC"], game.i18n.localize("CYPHERSYSTEM.Intellect"))) return;
    statData = calculateStatData(token.actor.data.data.pools.intellect.value);
    token.actor.update({"data.pools.intellect.value": statData});
    break;
    case "health":
    if (!checkToken(["NPC","Community","Companion"], game.i18n.localize("CYPHERSYSTEM.Health"))) return;
    statData = calculateStatData(token.actor.data.data.health.value);
    token.actor.update({"data.health.value": statData});
    break;
    case "infrastructure":
    if (!checkToken(["Community"], game.i18n.localize("CYPHERSYSTEM.Infrastructure"))) return;
    statData = calculateStatData(token.actor.data.data.infrastructure.value);
    token.actor.update({"data.infrastructure.value": statData});
    break;
    case "quantity":
    if (!checkToken(["Token"], game.i18n.localize("CYPHERSYSTEM.Quantity"))) return;
    statData = calculateStatData(token.actor.data.data.quantity.value);
    token.actor.update({"data.quantity.value": statData});
    break;
    default:
    return ui.notifications.warn(game.i18n.format("CYPHERSYSTEM.StatNotCompatible", {stat: stat}));
  }

  // Check whether a correct token is selected
  function checkToken(actorTypes, statString) {
    if (!token || !actorTypes.includes(token.actor.data.type)) {
      ui.notifications.warn(game.i18n.format("CYPHERSYSTEM.PleaseSelectTokenStat", {stat: statString}));
      return false;
    } else {
      return true;
    }
  }

  // Calculate the new stat value
  function calculateStatData(statData) {
    statData = statData + modifier;
    if (statData < 0) statData = 0;
    return statData;
  }
}

export function proposeIntrusion(actor) {
  // Check if user is GM
  if (!game.user.isGM) return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.IntrusionGMWarning"));

  // Check for actor
  if (!actor) {
    // Create list of PCs
    let selectOptions = "";
    for (let actor of game.actors.contents) {
      if (actor.data.type === "PC") selectOptions = selectOptions + `<option value=${actor.data._id}>${actor.data.name}</option>`;
    }

    if (selectOptions == "") return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.NoPCsNoIntrusion"));

    // Create dialog
    let d = new Dialog({
      title: game.i18n.localize("CYPHERSYSTEM.ProposeIntrusion"),
      content: chatCardProposeIntrusion(selectOptions),
      buttons: {
        apply: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("CYPHERSYSTEM.Apply"),
          callback: (html) => askForIntrusion(html.find('#selectPC').val())
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("CYPHERSYSTEM.Cancel"),
          callback: () => { }
        }
      },
      default: "apply",
      close: () => { }
    });
    d.render(true);
  } else {
    if (actor.data.type != "PC") return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.MacroOnlyAppliesToPC"));
    askForIntrusion(actor.data._id);
  }

  // Create chat message
  function askForIntrusion(actorId){
    let actor = game.actors.get(actorId);

    ChatMessage.create({
      content: chatCardAskForIntrusion(actor, actorId)
    })
  }
}

export function changeSymbolForFractions() {
  let slash = game.settings.get("cyphersystem", "useSlashForFractions") ? false : true;
  game.settings.set("cyphersystem", "useSlashForFractions", slash);
}

export function toggleAttacksOnSheet(token) {
  let toggle = token.actor.data.data.settings.equipment.attacks ? false : true;
  token.actor.update({"data.settings.equipment.attacks": toggle})
}

export function toggleArmorOnSheet(token) {
  let toggle = token.actor.data.data.settings.equipment.armor ? false : true;
  token.actor.update({"data.settings.equipment.armor": toggle})
}

export async function translateToRecursion(actor, recursion, focus) {
  // Check for PC
  if (!actor || actor.data.type != "PC") return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.MacroOnlyAppliesToPC"));

  // Define recursion name & workarble recursion variable
  let recursionName = recursion;
  recursion = "@" + recursion.toLowerCase();

  // Update Focus & Recursion
  await actor.update({
    "data.basic.focus": focus,
    "data.basic.additionalSentence": game.i18n.localize("CYPHERSYSTEM.OnRecursion") + " " + recursionName
  });

  applyRecursion();

  async function applyRecursion() {
    let updates = [];
    for (let item of actor.items) {
      let name = (!item.data.name) ? "" : item.data.name.toLowerCase();
      let description = (!item.data.data.description) ? "" : item.data.data.description.toLowerCase();
      if (name.includes(recursion) || description.includes(recursion)) {
        updates.push({_id: item.id, "data.archived": false});
      } else if (name.includes("@") || description.includes("@")) {
        updates.push({_id: item.id, "data.archived": true});
      }
    }

    await actor.updateEmbeddedDocuments("Item", updates);

    // Notify about translation
    ui.notifications.notify(game.i18n.format("CYPHERSYSTEM.PCTranslatedToRecursion", {actor: actor.name, recursion: recursionName}))
  }
}

export async function unarchiveItemsWithTag(actor, tag, signifier, archive) {
  // Check for PC
  if (!actor || actor.data.type != "PC") return ui.notifications.warn(game.i18n.localize("CYPHERSYSTEM.MacroOnlyAppliesToPC"));

  // Define default signifier & archive
  if (!signifier) signifier = "#";
  if (archive !== true) archive = false;

  // Define recursion name & workarble recursion variable
  let tagName = tag;
  tag = signifier + tag.toLowerCase();

  // Define archiving or unarchiving
  let archived = ((event.altKey && archive) || (!event.altKey && !archive)) ? false : true;

  let updates = [];
  for (let item of actor.items) {
    let name = (!item.data.name) ? "" : item.data.name.toLowerCase();
    let description = (!item.data.data.description) ? "" : item.data.data.description.toLowerCase();
    if (name.includes(tag) || description.includes(tag)) {
      updates.push({_id: item.id, "data.archived": archived});
    }
  }

  await actor.updateEmbeddedDocuments("Item", updates);
}

export async function archiveItemsWithTag(actor, tag, signifier) {
  await unarchiveItemsWithTag(actor, tag, signifier, true)
}