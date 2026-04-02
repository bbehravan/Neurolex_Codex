import type { LearnerProfile, SessionArtifact, SessionRun } from '../domain/types';
import { ArchitektService } from './architektService';
import { GrammatiktrainerService } from './grammatiktrainerService';
import { KorrektorService } from './korrektorService';
import { KuratorService } from './kuratorService';
import { MentorService } from './mentorService';
import { SchreibtrainerService } from './schreibtrainerService';
import { SprechtrainerService } from './sprechtrainerService';
import { WortmeisterService } from './wortmeisterService';

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function buildTimestamp(now: Date): string {
  return now.toISOString().replace(/[:]/g, '-');
}

function buildApplicationPrompt(profile: LearnerProfile): string {
  if (profile.activeLernauftrag) {
    return `Use the session outputs to advance the Lernauftrag: ${profile.activeLernauftrag}`;
  }

  return 'Use the focus structures in a short communicative speaking or writing task.';
}

export class UebungsmeisterService {
  private readonly architekt: ArchitektService;
  private readonly mentor: MentorService;
  private readonly wortmeister: WortmeisterService;
  private readonly grammatiktrainer: GrammatiktrainerService;
  private readonly kurator: KuratorService;
  private readonly schreibtrainer: SchreibtrainerService;
  private readonly sprechtrainer: SprechtrainerService;
  private readonly korrektor: KorrektorService;

  constructor(private readonly notesFolder: string) {
    const normalized = normalizeNotesRoot(notesFolder);
    this.architekt = new ArchitektService(normalized);
    this.mentor = new MentorService(normalized);
    this.wortmeister = new WortmeisterService(normalized);
    this.grammatiktrainer = new GrammatiktrainerService(normalized);
    this.kurator = new KuratorService(normalized);
    this.schreibtrainer = new SchreibtrainerService(normalized);
    this.sprechtrainer = new SprechtrainerService(normalized);
    this.korrektor = new KorrektorService(normalized);
  }

  private getNotesRoot(): string {
    return normalizeNotesRoot(this.notesFolder);
  }

  buildSessionRun(profile: LearnerProfile, now = new Date()): SessionRun {
    const generatedAt = now.toISOString();
    const timestamp = buildTimestamp(now);
    const isoDay = generatedAt.slice(0, 10);
    const monthKey = isoDay.slice(0, 7);
    const sessionId = `session-${timestamp}`;

    const planArtifactResult = this.architekt.buildSessionPlanArtifact(profile, now);
    const vocabularyArtifact = this.wortmeister.buildWarmupArtifact(profile, planArtifactResult.plan, now);
    const grammarArtifact = this.grammatiktrainer.buildCoreArtifact(profile, planArtifactResult.plan, now);
    const curationArtifact = this.kurator.buildCurationArtifact(profile, planArtifactResult.plan, now);
    const applicationArtifact = planArtifactResult.plan.applicationMode === 'writing'
      ? this.schreibtrainer.buildWritingArtifact(profile, planArtifactResult.plan, now)
      : this.sprechtrainer.buildSpeakingArtifact(profile, planArtifactResult.plan, now);
    const correctionArtifact = this.korrektor.buildCorrectionGuideArtifact(profile, planArtifactResult.plan, now);
    const recapArtifactResult = this.mentor.buildSessionRecapArtifact(profile, planArtifactResult.plan, now);

    const sessionRunPath = `${this.getNotesRoot()}sessions/${monthKey}/session-run-${timestamp}.md`;
    const sessionRunContent = [
      '---',
      'title: "NeuroLex Session Run"',
      'type: session-run',
      `date: ${isoDay}`,
      `session_id: ${sessionId}`,
      `target_language: ${profile.targetLanguage}`,
      '---',
      '',
      '# NeuroLex Session Run',
      '',
      '## Flow',
      '- Warm-up: Wortmeister vocabulary review',
      '- Core: Grammatiktrainer targeted practice',
      `- Application: ${planArtifactResult.plan.applicationMode === 'writing' ? 'Schreibtrainer' : 'Sprechtrainer'} with Kurator framing and Korrektor guidance`,
      '- Cool-down: Mentor recap and reflection',
      '',
      '## Focus Structures',
      ...(planArtifactResult.plan.focusSelections.map((selection) =>
        `- ${selection.structureId} (${selection.title})`
      )),
      '',
      '## Lernauftrag Adaptation',
      `- Application mode: ${planArtifactResult.plan.applicationMode}`,
      `- Curated brief: ${planArtifactResult.plan.curationBrief}`,
      '',
      '## Artifacts',
      `- Session plan: ${planArtifactResult.path}`,
      `- Vocabulary warm-up: ${vocabularyArtifact.path}`,
      `- Grammar core: ${grammarArtifact.path}`,
      `- Curation brief: ${curationArtifact.path}`,
      `- Application task: ${applicationArtifact.path}`,
      `- Correction guide: ${correctionArtifact.path}`,
      `- Session recap: ${recapArtifactResult.path}`,
      '',
      '## Application Prompt',
      `- ${buildApplicationPrompt(profile)}`,
      '',
    ].join('\n');

    const artifacts: SessionArtifact[] = [
      {
        kind: 'session-plan',
        path: planArtifactResult.path,
        content: planArtifactResult.content,
      },
      vocabularyArtifact,
      grammarArtifact,
      curationArtifact,
      applicationArtifact,
      correctionArtifact,
      {
        kind: 'session-recap',
        path: recapArtifactResult.path,
        content: recapArtifactResult.content,
      },
      {
        kind: 'session-run',
        path: sessionRunPath,
        content: sessionRunContent,
      },
    ];

    return {
      sessionId,
      generatedAt,
      plan: planArtifactResult.plan,
      summary: recapArtifactResult.summary,
      artifacts,
    };
  }
}
