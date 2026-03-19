const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

describe('Type Definitions', () => {
  it('types module should export from dist', () => {
    const types = require('../dist/types');
    assert.ok(types !== undefined);
  });

  it('source types file should exist', () => {
    const typesPath = path.join(__dirname, '..', 'src', 'types', 'index.ts');
    assert.ok(fs.existsSync(typesPath), 'src/types/index.ts should exist');
  });
});

describe('Office Map', () => {
  let officeMap;

  it('should load office map module', () => {
    officeMap = require('../dist/visual/office-map');
    assert.ok(officeMap);
  });

  it('should have correct dimensions', () => {
    assert.equal(officeMap.OFFICE_WIDTH, 52);
    assert.equal(officeMap.OFFICE_HEIGHT, 17);
  });

  it('should have office layout string', () => {
    assert.ok(typeof officeMap.OFFICE_LAYOUT === 'string');
    assert.ok(officeMap.OFFICE_LAYOUT.length > 0);
  });

  it('getOfficeLines should return array of lines', () => {
    const lines = officeMap.getOfficeLines();
    assert.ok(Array.isArray(lines));
    assert.equal(lines.length, officeMap.OFFICE_HEIGHT);
  });

  it('should define room areas', () => {
    const rooms = officeMap.ROOM_AREAS;
    assert.ok(rooms['meeting-room'], 'Meeting room should exist');
    assert.ok(rooms['ceo-office'], 'CEO office should exist');
    assert.ok(rooms['lounge'], 'Lounge should exist');
  });

  it('meeting room should have valid coordinates', () => {
    const mr = officeMap.ROOM_AREAS['meeting-room'];
    assert.ok(mr.x1 < mr.x2, 'x1 should be less than x2');
    assert.ok(mr.y1 < mr.y2, 'y1 should be less than y2');
  });

  it('should define status animations', () => {
    const anims = officeMap.STATUS_ANIMATIONS;
    assert.ok(anims.coding, 'coding animation should exist');
    assert.ok(anims.thinking, 'thinking animation should exist');
    assert.ok(anims.meeting, 'meeting animation should exist');
    assert.ok(Array.isArray(anims.coding), 'animations should be arrays');
  });

  it('should have 13 room areas', () => {
    const count = Object.keys(officeMap.ROOM_AREAS).length;
    assert.equal(count, 13, `Expected 13 rooms, got ${count}`);
  });
});
