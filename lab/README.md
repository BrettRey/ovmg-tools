# Licensing lab

Single-file HTML/JS interactive tool for building intuition about the OVMG
formalization. Prototype as a claude.ai artifact; production on GitHub Pages.
Wraps `../js/engine.js`; no other numerical code allowed here.

Planned tabs (build order: Tab 1 -> fixtures pass -> Tab 2 -> Tab 3):

1. **Single node.** Sliders: opportunity rate N, counterfactual choice
   rho-star, positive-token rate, outside-option share, memory discount
   delta_m. Displays: posterior mean trajectory with credible ribbon; live dot
   in the (mean, concentration) state space with the status regions labelled
   (paper Fig. 2). Framing button injects a prior shift mid-run:
   starved/divided states jump, preempted gaps don't (the satiation rank
   order, one click). Presets: licensed (*Which car did you buy?*), preempted
   gap (\*Which did you buy car?), starved (*friend of whose*), winnerless
   cell (*pobedit'* 1sg), moribund contrast (N decays; dispersion rises before
   mean moves).
2. **Population.** ~50 agents, each running the engine on its own sampled
   input stream; histogram of individual means bimodalizing over time;
   repair-coupling toggle (steepens basins). Per-agent CrI = epistemic;
   histogram spread = heterogeneity.
3. **Diagnostic walkthrough.** The paper's four-step tree (coverage ->
   unification -> saturation -> licensing) as guided interaction, outputting
   predicted (F, Phi) phenomenology per case.
