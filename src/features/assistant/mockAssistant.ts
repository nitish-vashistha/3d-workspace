import type { PlacedItem, AIProposal, ProposedItemMove } from '../../types/scene';
import { GRID } from '../../types/scene';
import { computeViolations } from '../rule-validation/ruleEngine';
import { snapToGrid } from '../../store/useEditorStore';

interface AssistantResponse {
  text: string;
  proposal: AIProposal | null;
}

/**
 * Deterministic AI assistant logic.
 * Supports:
 * - Remediation of ALL violations in the layout in one batch
 * - Targeted remediation of a single specific violation
 * - Layout status summaries
 * - Conversational industrial twin layout assistance
 */
export function generateAssistantResponse(
  query: string,
  items: Record<string, PlacedItem>,
  targetViolationId?: string
): AssistantResponse {
  const itemList = Object.values(items);
  const violations = computeViolations(items);
  const lowerQuery = query.toLowerCase();

  // 1. Batch remediation: "fix all" or user explicitly wants all violations cleared
  const wantsAllFixes =
    (lowerQuery.includes('all') && (lowerQuery.includes('fix') || lowerQuery.includes('resolve') || lowerQuery.includes('clear'))) ||
    lowerQuery === 'fix all violations';

  if (wantsAllFixes && violations.length > 0) {
    const proposedMoves: ProposedItemMove[] = [];
    // Clone items state to simulate layout as we place each resolved item
    const workingItems: Record<string, PlacedItem> = { ...items };

    // Resolve violations iteratively
    let activeViolations = computeViolations(workingItems);
    let iterations = 0;
    const maxIterations = 20;

    while (activeViolations.length > 0 && iterations < maxIterations) {
      iterations++;
      const currentViolation = activeViolations[0];
      // Pick itemB to relocate (or itemA if itemB was already relocated)
      const chosenItemId = proposedMoves.some(m => m.itemId === currentViolation.itemB)
        ? currentViolation.itemA
        : currentViolation.itemB;

      const itemToMove = workingItems[chosenItemId];
      if (!itemToMove) break;

      const safePos = findClearPosition(itemToMove, workingItems);

      // Update working state
      workingItems[chosenItemId] = {
        ...itemToMove,
        x: safePos.x,
        z: safePos.z,
      };

      // Add to proposed moves (or update if already moved)
      const existingIdx = proposedMoves.findIndex(m => m.itemId === chosenItemId);
      if (existingIdx >= 0) {
        proposedMoves[existingIdx].newX = safePos.x;
        proposedMoves[existingIdx].newZ = safePos.z;
      } else {
        proposedMoves.push({
          itemId: chosenItemId,
          name: itemToMove.name,
          newX: safePos.x,
          newZ: safePos.z,
        });
      }

      activeViolations = computeViolations(workingItems);
    }

    const itemsSummary = proposedMoves.map(m => `• Relocate "${m.name}" to (${m.newX.toFixed(1)}m, ${m.newZ.toFixed(1)}m)`).join('\n');

    return {
      text: `Comprehensive Clearance Remediation Plan:\nResolved ${violations.length} clearance violation(s) across ${proposedMoves.length} equipment unit(s):\n\n${itemsSummary}\n\nAll ${proposedMoves.length} proposed repositioning(s) are highlighted in green in the 3D viewport. Click Accept to apply them atomically.`,
      proposal: {
        description: `Batch relocate ${proposedMoves.length} unit(s) to clear all ${violations.length} safety violation(s)`,
        itemId: proposedMoves[0]?.itemId || '',
        newX: proposedMoves[0]?.newX || 0,
        newZ: proposedMoves[0]?.newZ || 0,
        moves: proposedMoves,
        status: 'pending',
      },
    };
  }

  // 2. Targeted or single violation fix:
  // (Either targeted specifically via targetViolationId or default "fix violation")
  if (
    (lowerQuery.includes('fix') ||
      lowerQuery.includes('resolve') ||
      lowerQuery.includes('clear') ||
      lowerQuery.includes('violation')) &&
    violations.length > 0
  ) {
    let violation = violations[0];
    if (targetViolationId) {
      const found = violations.find(v => `${v.itemA}-${v.itemB}` === targetViolationId);
      if (found) violation = found;
    }

    const itemToMove = items[violation.itemB] || items[violation.itemA];
    if (itemToMove) {
      const fixedPos = findClearPosition(itemToMove, items);
      return {
        text: `Clearance Violation Remediation:\nIdentified violation between "${violation.nameA}" and "${violation.nameB}" (${violation.distance}m separation; min requirement is ${GRID.MIN_CLEARANCE}m).\n\nProposal: Relocate "${itemToMove.name}" to (${fixedPos.x.toFixed(1)}m, ${fixedPos.z.toFixed(1)}m) to achieve required safety margin.`,
        proposal: {
          description: `Relocate ${itemToMove.name} to (${fixedPos.x}m, ${fixedPos.z}m) to clear violation with ${violation.nameA}`,
          itemId: itemToMove.id,
          newX: fixedPos.x,
          newZ: fixedPos.z,
          moves: [
            {
              itemId: itemToMove.id,
              name: itemToMove.name,
              newX: fixedPos.x,
              newZ: fixedPos.z,
            },
          ],
          status: 'pending',
        },
      };
    }
  }

  // 3. Item detection / inspection / inventory / list / summary
  const isDetectionQuery =
    lowerQuery.includes('detect') ||
    lowerQuery.includes('find') ||
    lowerQuery.includes('list') ||
    lowerQuery.includes('show') ||
    lowerQuery.includes('what') ||
    lowerQuery.includes('item') ||
    lowerQuery.includes('equipment') ||
    lowerQuery.includes('scan') ||
    lowerQuery.includes('inspect') ||
    lowerQuery.includes('inventory') ||
    lowerQuery.includes('count') ||
    lowerQuery.includes('summary') ||
    lowerQuery.includes('how many') ||
    lowerQuery.includes('status') ||
    lowerQuery.includes('overview') ||
    lowerQuery.includes('check');

  if (isDetectionQuery) {
    if (itemList.length === 0) {
      return {
        text: `Inspection Report: 0 equipment units detected.\n\nThe 20m × 12m industrial floor is currently unoccupied.\n\nTo place equipment:\n1. Choose a unit from the Equipment Palette (Cabinet, Drive, or Control Panel).\n2. Click anywhere on the floor grid to place it.\n3. Or click "Benchmark 500" in the top bar to populate 500 test units.`,
        proposal: null,
      };
    }

    const typeCounts = new Map<string, number>();
    itemList.forEach(item => {
      typeCounts.set(item.type, (typeCounts.get(item.type) || 0) + 1);
    });
    const typeBreakdown = Array.from(typeCounts.entries())
      .map(([type, count]) => `  • ${type}: ${count} unit(s)`)
      .join('\n');

    // List individual items up to first 12
    const itemsList = itemList.slice(0, 12).map(item => {
      const violating = violations.find(v => v.itemA === item.id || v.itemB === item.id);
      const statusNote = violating
        ? `⚠ Clearance issue with ${violating.itemA === item.id ? violating.nameB : violating.nameA} (${violating.distance}m)`
        : '✓ Clear';
      return `• ${item.name} (${item.type}): Pos (${item.x.toFixed(1)}m, ${item.z.toFixed(1)}m), Rot ${item.rotation}° [${statusNote}]`;
    }).join('\n');

    const moreText = itemList.length > 12 ? `\n...and ${itemList.length - 12} more units in scene.` : '';

    return {
      text: `Industrial Equipment Detection Report:\nDetected ${itemList.length} equipment unit(s) across the 20m × 12m floor grid:\n\nType Breakdown:\n${typeBreakdown}\n\nDetected Units:\n${itemsList}${moreText}\n\nClearance Rule Status: ${
        violations.length === 0
          ? '✓ COMPLIANT (0 violations detected)'
          : `⚠ NON-COMPLIANT (${violations.length} active clearance violation(s))`
      }`,
      proposal: null,
    };
  }

  // 4. Move queries
  if (lowerQuery.includes('move') && itemList.length > 0) {
    const itemToMove = itemList.find(i => lowerQuery.includes(i.name.toLowerCase()) || lowerQuery.includes(i.type.toLowerCase())) || itemList[0];
    const safePos = findClearPosition(itemToMove, items);
    return {
      text: `Equipment Relocation Proposal:\nProposing to relocate "${itemToMove.name}" from (${itemToMove.x.toFixed(1)}m, ${itemToMove.z.toFixed(1)}m) to (${safePos.x.toFixed(1)}m, ${safePos.z.toFixed(1)}m) on the grid.\n\nA green ghost preview is now visible in the 3D viewport. Click Accept to apply.`,
      proposal: {
        description: `Move ${itemToMove.name} to (${safePos.x}m, ${safePos.z}m)`,
        itemId: itemToMove.id,
        newX: safePos.x,
        newZ: safePos.z,
        moves: [
          {
            itemId: itemToMove.id,
            name: itemToMove.name,
            newX: safePos.x,
            newZ: safePos.z,
          },
        ],
        status: 'pending',
      },
    };
  }

  // 5. Default guidance
  const detectedSummary = itemList.length > 0
    ? `• Detected items: ${itemList.length} units (${itemList.map(i => i.name).slice(0, 4).join(', ')}${itemList.length > 4 ? '...' : ''})`
    : '• Detected items: 0 (Grid is unoccupied)';

  return {
    text: `Industrial Digital Twin Assistant active.\n${detectedSummary}\n• Active clearance violations: ${violations.length}\n\nAvailable remediation actions:\n• "Detect all items" — full equipment inventory & safety scan\n• "Fix all violations" — batch relocates all violating equipment\n• "Fix single violation" — remediates one violation at a time\n• "Move [equipment]" — proposes moving equipment to safe zone`,
    proposal: null,
  };
}

/**
 * Find a collision-free grid position for an item.
 */
function findClearPosition(
  item: PlacedItem,
  allItems: Record<string, PlacedItem>
): { x: number; z: number } {
  for (let radius = 1; radius <= 24; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (Math.abs(dx) !== radius && Math.abs(dz) !== radius) continue;
        const testX = snapToGrid(item.x + dx * GRID.CELL_SIZE);
        const testZ = snapToGrid(item.z + dz * GRID.CELL_SIZE);

        if (testX < 1.0 || testX > GRID.WIDTH - 1.0) continue;
        if (testZ < 1.0 || testZ > GRID.DEPTH - 1.0) continue;

        const testItems: Record<string, PlacedItem> = {
          ...allItems,
          [item.id]: { ...item, x: testX, z: testZ },
        };
        const testViolations = computeViolations(testItems);
        const itemViolations = testViolations.filter(
          v => v.itemA === item.id || v.itemB === item.id
        );

        if (itemViolations.length === 0) {
          return { x: testX, z: testZ };
        }
      }
    }
  }

  return { x: snapToGrid(GRID.WIDTH - 2), z: snapToGrid(GRID.DEPTH - 2) };
}

/**
 * Stream text chunks.
 */
export async function* streamResponse(text: string): AsyncGenerator<string> {
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? '' : ' ') + words[i];
    yield chunk;
    await new Promise(resolve => setTimeout(resolve, 15 + Math.random() * 20));
  }
}
