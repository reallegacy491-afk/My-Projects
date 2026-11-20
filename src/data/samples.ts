export interface SampleTopic {
  id: string;
  label: string;
  subject: string;
  notes: string;
}

export const SAMPLE_TOPICS: SampleTopic[] = [
  {
    id: "assembly-language",
    label: "Assembly Language",
    subject: "Computer Architecture · x86-64",
    notes: `x86-64 Assembly Language Fundamentals

Registers & Data Movement:
- General-purpose 64-bit registers: RAX (accumulator/return value), RBX (callee-saved base), RCX (4th arg / loop counter), RDX (3rd arg), RSI (2nd arg), RDI (1st arg), RSP (stack pointer), RBP (base pointer), R8-R15.
- Sub-register aliasing: Writing to a 32-bit register like EAX automatically zero-extends into the upper 32 bits of RAX, whereas writing to 16-bit AX or 8-bit AL preserves the upper bits.
- Common instructions: MOV dst, src (copies value; memory-to-memory MOV is invalid); LEA dst, [mem] (Load Effective Address computes an address/arithmetic without dereferencing memory).

The Stack & Calling Convention (System V AMD64 ABI):
- The stack grows downward toward lower memory addresses. PUSH decrements RSP by 8 and stores the value; POP reads from [RSP] and increments RSP by 8.
- CALL pushes the return address (next RIP) onto the stack and jumps to the target function; RET pops that address back into RIP.
- Caller-saved (volatile): RAX, RCX, RDX, RSI, RDI, R8-R11. Callee-saved (non-volatile): RBX, RBP, R12-R15.

Flags & Control Flow:
- RFLAGS stores condition codes updated by CMP, TEST, ADD, SUB: ZF (Zero Flag), SF (Sign Flag), CF (Carry Flag - unsigned overflow), OF (Overflow Flag - signed overflow).
- CMP a, b computes (a - b) and discards the result, setting flags. TEST a, b computes (a & b) and sets ZF/SF without modifying operands.
- Unsigned jumps use JA/JB (Above/Below); signed jumps use JG/JL (Greater/Less).`,
  },
  {
    id: "constitutional-law",
    label: "Constitutional Law: Equality",
    subject: "Public Law · Equal Protection",
    notes: `Constitutional Law: Equal Protection & Tiers of Scrutiny (14th Amendment)

Core Doctrine:
- The Equal Protection Clause of the 14th Amendment prohibits states from denying any person within their jurisdiction the equal protection of the laws (applied to the federal government via reverse incorporation through the 5th Amendment Due Process Clause in Bolling v. Sharpe).
- Threshold requirement: To trigger heightened scrutiny, a challenger must prove discriminatory purpose or intent (Washington v. Davis), not merely disparate impact—unless a facially neutral law is administered in a clearly discriminatory manner (Yick Wo v. Hopkins).

Three Tiers of Judicial Scrutiny:
1. Strict Scrutiny (Suspect Classifications: race, national origin, state-level alienage; or Fundamental Rights):
   - Government bears the burden to prove the law is narrowly tailored (least restrictive means) to achieve a compelling government interest. Rarely survived ("strict in theory, fatal in fact," though upheld in narrow affirmative action/national security contexts before recent precedents).
2. Intermediate Scrutiny (Quasi-Suspect Classifications: sex/gender, non-marital children):
   - Government must prove the law is substantially related to an important government interest. For gender classifications, the state must show an "exceedingly persuasive justification" (United States v. Virginia / VMI) and cannot rely on archaic gender stereotypes.
3. Rational Basis Review (All other classifications: age, disability, wealth, economic regulation):
   - Challenger bears the burden to prove the law is not rationally related to any conceivable legitimate government interest. Extremely deferential to legislatures; however, "rational basis with bite" invalidates laws driven purely by animus against an unpopular group (Romer v. Evans, Cleburne).`,
  },
  {
    id: "photosynthesis",
    label: "Photosynthesis",
    subject: "Cellular Biology · Bioenergetics",
    notes: `Photosynthesis: Light-Dependent Reactions & The Calvin Cycle

Overall Equation: 6 CO2 + 6 H2O + Light Energy -> C6H12O6 + 6 O2
Occurs in chloroplasts: thylakoid membranes host the light-dependent reactions, while the surrounding stroma hosts the Calvin Cycle (light-independent reactions).

Stage 1 — Light-Dependent Reactions (Thylakoid Membrane):
- Photosystem II (PSII, P680) absorbs photons, exciting electrons to a primary electron acceptor. Water is split via photolysis (2 H2O -> 4 H+ + 4 e- + O2), replacing PSII's lost electrons and releasing O2 as a byproduct.
- Electrons flow down an electron transport chain (plastoquinone -> cytochrome b6f -> plastocyanin), pumping H+ protons from the stroma into the thylakoid lumen to create an electrochemical proton gradient.
- Photosystem I (PSI, P700) re-excites electrons with light and passes them to ferredoxin and NADP+ reductase, reducing NADP+ to NADPH.
- ATP Synthase uses the proton motive force (chemiosmosis, H+ flowing back into the stroma) to phosphorylate ADP into ATP. Note: Cyclic electron flow uses only PSI to produce extra ATP without generating NADPH or O2.

Stage 2 — The Calvin Cycle (Stroma):
1. Carbon Fixation: The enzyme RuBisCO catalyzes the attachment of CO2 to 5-carbon RuBP, forming an unstable 6-carbon intermediate that immediately splits into two 3-carbon molecules of 3-PGA.
2. Reduction: ATP and NADPH from the light reactions convert 3-PGA into G3P (glyceraldehyde-3-phosphate). For every 3 CO2 fixed, 6 G3P are made, but only 1 G3P exits to build glucose/carbohydrates.
3. Regeneration: The remaining 5 G3P molecules use 3 ATP to regenerate 3 molecules of RuBP so the cycle can continue.
- Photorespiration occurs in hot, dry climates when stomata close and RuBisCO binds O2 instead of CO2; C4 and CAM plants spatially or temporally separate carbon fixation to minimize this loss.`,
  },
];
