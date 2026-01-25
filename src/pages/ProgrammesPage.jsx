import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Header } from "../components/layout";
import { Card, Button, Modal, Input } from "../components/common";
import {
  db,
  getProgrammes,
  startProgramme,
  getDefaultRirTarget,
} from "../db/database";

export default function ProgrammesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProgramme, setNewProgramme] = useState({
    name: "",
    durationWeeks: 6,
    daysPerWeek: 4,
    rirTargets: {},
  });
  const [showRirConfig, setShowRirConfig] = useState(false);

  const programmes = useLiveQuery(() => getProgrammes(), []);

  // Generate default RIR targets when duration changes
  useEffect(() => {
    const targets = {};
    for (let week = 1; week <= newProgramme.durationWeeks; week++) {
      targets[week] = getDefaultRirTarget(week, newProgramme.durationWeeks);
    }
    setNewProgramme((prev) => ({ ...prev, rirTargets: targets }));
  }, [newProgramme.durationWeeks]);

  const handleCreateProgramme = async () => {
    if (!newProgramme.name.trim()) return;

    await db.programmes.add({
      name: newProgramme.name.trim(),
      durationWeeks: newProgramme.durationWeeks,
      daysPerWeek: newProgramme.daysPerWeek,
      rirTargets: newProgramme.rirTargets,
      createdAt: new Date().toISOString(),
      isActive: 0,
      currentWeek: 1,
      startDate: null,
    });

    setNewProgramme({
      name: "",
      durationWeeks: 6,
      daysPerWeek: 4,
      rirTargets: {},
    });
    setShowCreateModal(false);
    setShowRirConfig(false);
  };

  const handleStartProgramme = async (programmeId) => {
    await startProgramme(programmeId);
  };

  const handleDeleteProgramme = async (programmeId) => {
    if (confirm("Delete this programme and all its templates?")) {
      const templates = await db.workoutTemplates
        .where("programmeId")
        .equals(programmeId)
        .toArray();
      for (const template of templates) {
        await db.templateExercises
          .where("templateId")
          .equals(template.id)
          .delete();
      }
      await db.workoutTemplates
        .where("programmeId")
        .equals(programmeId)
        .delete();
      await db.weekLogs.where("programmeId").equals(programmeId).delete();
      await db.programmes.delete(programmeId);
    }
  };

  const updateRirTarget = (week, value) => {
    setNewProgramme((prev) => ({
      ...prev,
      rirTargets: {
        ...prev.rirTargets,
        [week]: value,
      },
    }));
  };

  const weekOptions = [4, 5, 6, 8, 10, 12];
  const daysOptions = [2, 3, 4, 5, 6];
  const rirOptions = [1, 2, 3, 4, 5];

  // Helper to get RIR color
  const getRirColor = (rir) => {
    if (rir <= 1) return "bg-red-500 text-white";
    if (rir === 2) return "bg-orange-500 text-white";
    if (rir === 3) return "bg-green-500 text-white";
    return "bg-green-400 text-white"; // 4-5 (deload)
  };

  return (
    <>
      <Header
        title="Programmes"
        rightAction={
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        }
      />

      <div className="space-y-4 pt-4">
        {programmes && programmes.length > 0 ? (
          programmes.map((programme) => (
            <Card key={programme.id} className="p-0 overflow-hidden">
              <Link to={`/programmes/${programme.id}`} className="block p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">
                        {programme.name}
                      </h3>
                      {programme.isActive === 1 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {programme.durationWeeks || 6} weeks •{" "}
                      {programme.daysPerWeek || 4} days/week
                    </p>
                    {programme.isActive === 1 && programme.startDate && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: `${((programme.currentWeek || 1) / (programme.durationWeeks || 6)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            Week {programme.currentWeek || 1}/
                            {programme.durationWeeks || 6}
                          </span>
                        </div>
                        {programme.rirTargets && (
                          <p className="text-xs text-indigo-600 mt-1">
                            Target RIR:{" "}
                            {programme.rirTargets[programme.currentWeek] ??
                              getDefaultRirTarget(
                                programme.currentWeek || 1,
                                programme.durationWeeks || 6,
                              )}
                          </p>
                        )}
                      </div>
                    )}
                    {/* RIR targets preview for inactive programmes */}
                    {programme.isActive !== 1 && programme.rirTargets && (
                      <div className="flex gap-1 mt-2">
                        {Object.entries(programme.rirTargets)
                          .slice(0, 6)
                          .map(([week, rir]) => (
                            <span
                              key={week}
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                rir <= 1
                                  ? "bg-red-100 text-red-700"
                                  : rir === 2
                                    ? "bg-orange-100 text-orange-700"
                                    : rir === 3
                                      ? "bg-green-100 text-green-700"
                                      : "bg-blue-100 text-blue-700"
                              }`}
                              title={`Week ${week}: ${rir} RIR`}
                            >
                              W{week}:{rir}
                            </span>
                          ))}
                        {Object.keys(programme.rirTargets).length > 6 && (
                          <span className="text-xs text-gray-400">...</span>
                        )}
                      </div>
                    )}
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
              <div className="flex border-t border-gray-100">
                {programme.isActive !== 1 ? (
                  <button
                    onClick={() => handleStartProgramme(programme.id)}
                    className="flex-1 py-3 text-sm font-medium text-green-600 hover:bg-green-50"
                  >
                    Start Programme
                  </button>
                ) : (
                  <Link
                    to={`/programmes/${programme.id}`}
                    className="flex-1 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 text-center"
                  >
                    Continue
                  </Link>
                )}
                <button
                  onClick={() => handleDeleteProgramme(programme.id)}
                  className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 border-l border-gray-100"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No programmes yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create a mesocycle to plan your training
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Programme
            </Button>
          </Card>
        )}
      </div>

      {/* Create Programme Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowRirConfig(false);
          setNewProgramme({
            name: "",
            durationWeeks: 6,
            daysPerWeek: 4,
            rirTargets: {},
          });
        }}
        title="New Mesocycle"
      >
        <div className="space-y-5">
          <Input
            label="Programme Name"
            value={newProgramme.name}
            onChange={(e) =>
              setNewProgramme({ ...newProgramme, name: e.target.value })
            }
            placeholder="e.g., Hypertrophy Block"
            autoFocus
          />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Duration (weeks)
            </label>
            <div className="flex flex-wrap gap-2">
              {weekOptions.map((weeks) => (
                <button
                  key={weeks}
                  onClick={() =>
                    setNewProgramme({ ...newProgramme, durationWeeks: weeks })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    newProgramme.durationWeeks === weeks
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {weeks}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Training Days per Week
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOptions.map((days) => (
                <button
                  key={days}
                  onClick={() =>
                    setNewProgramme({ ...newProgramme, daysPerWeek: days })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    newProgramme.daysPerWeek === days
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {days}
                </button>
              ))}
            </div>
          </div>

          {/* RIR Targets Section */}
          <div>
            <button
              onClick={() => setShowRirConfig(!showRirConfig)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 w-full"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showRirConfig ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              RIR Targets per Week
              <span className="ml-auto text-xs text-gray-400 font-normal">
                Default: 3→2→1 cycle
              </span>
            </button>

            {showRirConfig && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                <p className="text-xs text-gray-500">
                  Set target Reps In Reserve for each week. Lower RIR = harder
                  training.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from(
                    { length: newProgramme.durationWeeks },
                    (_, i) => i + 1,
                  ).map((week) => (
                    <div key={week} className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium w-16 ${
                          week === newProgramme.durationWeeks
                            ? "text-blue-600"
                            : "text-gray-600"
                        }`}
                      >
                        Week {week}
                        {week === newProgramme.durationWeeks && " (D)"}
                      </span>
                      <div className="flex gap-1">
                        {rirOptions.map((rir) => (
                          <button
                            key={rir}
                            onClick={() => updateRirTarget(week, rir)}
                            className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                              newProgramme.rirTargets[week] === rir
                                ? getRirColor(rir)
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            }`}
                          >
                            {rir}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500"></span> 1 RIR
                    (Hard)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-orange-500"></span> 2
                    RIR
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-500"></span> 3+
                    RIR
                  </span>
                </div>
              </div>
            )}

            {/* Preview RIR pattern */}
            {!showRirConfig && (
              <div className="flex gap-1 mt-2">
                {Object.entries(newProgramme.rirTargets).map(([week, rir]) => (
                  <span
                    key={week}
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      rir <= 1
                        ? "bg-red-100 text-red-700"
                        : rir === 2
                          ? "bg-orange-100 text-orange-700"
                          : rir === 3
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {rir}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button
            fullWidth
            onClick={handleCreateProgramme}
            disabled={!newProgramme.name.trim()}
          >
            Create Programme
          </Button>
        </div>
      </Modal>
    </>
  );
}
