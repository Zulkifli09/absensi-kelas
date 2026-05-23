import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BookOpen,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  FileDown,
  GraduationCap,
  Plus,
  Save,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'absensi-kelas-pixel-v1';
const meetings = Array.from({ length: 16 }, (_, index) => index + 1);

const statusMeta = {
  H: { label: 'Hadir', short: 'H', className: 'hadir' },
  I: { label: 'Izin', short: 'I', className: 'izin' },
  S: { label: 'Sakit', short: 'S', className: 'sakit' },
  A: { label: 'Alfa', short: 'A', className: 'alfa' },
  '-': { label: 'Kosong', short: '-', className: 'kosong' },
};

const sampleStudents = [
  { id: crypto.randomUUID(), nim: '230001', name: 'Alya Putri' },
  { id: crypto.randomUUID(), nim: '230002', name: 'Bima Pratama' },
  { id: crypto.randomUUID(), nim: '230003', name: 'Citra Lestari' },
];

const initialState = {
  courses: [
    {
      id: crypto.randomUUID(),
      name: 'Pemrograman Web',
      lecturer: 'Dosen Pengampu',
      room: 'Ruang 2.1',
      day: 'Senin',
      startTime: '08:00',
      students: sampleStudents,
      attendance: {},
      notes: {},
    },
  ],
  activeCourseId: null,
};

initialState.activeCourseId = initialState.courses[0].id;

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.courses)) return initialState;
    return {
      ...parsed,
      activeCourseId: parsed.activeCourseId || parsed.courses[0]?.id || null,
    };
  } catch {
    return initialState;
  }
}

function App() {
  const [data, setData] = useState(loadData);
  const [courseForm, setCourseForm] = useState({
    name: '',
    lecturer: '',
    room: '',
    day: 'Senin',
    startTime: '08:00',
  });
  const [studentForm, setStudentForm] = useState({ nim: '', name: '' });
  const [selectedMeeting, setSelectedMeeting] = useState(1);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const activeCourse = useMemo(
    () => data.courses.find((course) => course.id === data.activeCourseId) || data.courses[0],
    [data],
  );

  const filteredStudents = useMemo(() => {
    if (!activeCourse) return [];
    const keyword = query.trim().toLowerCase();
    if (!keyword) return activeCourse.students;
    return activeCourse.students.filter(
      (student) =>
        student.name.toLowerCase().includes(keyword) ||
        student.nim.toLowerCase().includes(keyword),
    );
  }, [activeCourse, query]);

  const summary = useMemo(() => {
    if (!activeCourse) return { H: 0, I: 0, S: 0, A: 0, '-': 0, percentage: 0 };
    const result = { H: 0, I: 0, S: 0, A: 0, '-': 0 };
    activeCourse.students.forEach((student) => {
      const status = getStatus(activeCourse, student.id, selectedMeeting);
      result[status] += 1;
    });
    const total = activeCourse.students.length || 1;
    result.percentage = Math.round((result.H / total) * 100);
    return result;
  }, [activeCourse, selectedMeeting]);

  function updateActiveCourse(updater) {
    setData((current) => ({
      ...current,
      courses: current.courses.map((course) =>
        course.id === current.activeCourseId ? updater(course) : course,
      ),
    }));
  }

  function addCourse(event) {
    event.preventDefault();
    if (!courseForm.name.trim()) return;
    const newCourse = {
      id: crypto.randomUUID(),
      name: courseForm.name.trim(),
      lecturer: courseForm.lecturer.trim() || 'Belum diisi',
      room: courseForm.room.trim() || 'Belum diisi',
      day: courseForm.day,
      startTime: courseForm.startTime || '08:00',
      students: [],
      attendance: {},
      notes: {},
    };
    setData((current) => ({
      courses: [...current.courses, newCourse],
      activeCourseId: newCourse.id,
    }));
    setCourseForm({ name: '', lecturer: '', room: '', day: 'Senin', startTime: '08:00' });
  }

  function addStudent(event) {
    event.preventDefault();
    if (!activeCourse || !studentForm.name.trim()) return;
    const newStudent = {
      id: crypto.randomUUID(),
      nim: studentForm.nim.trim() || '-',
      name: studentForm.name.trim(),
    };
    updateActiveCourse((course) => ({
      ...course,
      students: [...course.students, newStudent].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    setStudentForm({ nim: '', name: '' });
  }

  function removeStudent(studentId) {
    updateActiveCourse((course) => {
      const attendance = { ...course.attendance };
      meetings.forEach((meeting) => {
        if (attendance[meeting]) {
          const meetingData = { ...attendance[meeting] };
          delete meetingData[studentId];
          attendance[meeting] = meetingData;
        }
      });
      return {
        ...course,
        students: course.students.filter((student) => student.id !== studentId),
        attendance,
      };
    });
  }

  function removeCourse(courseId) {
    setData((current) => {
      const courses = current.courses.filter((course) => course.id !== courseId);
      return {
        courses,
        activeCourseId: courses[0]?.id || null,
      };
    });
  }

  function setAttendance(studentId, meeting, status) {
    updateActiveCourse((course) => ({
      ...course,
      attendance: {
        ...course.attendance,
        [meeting]: {
          ...(course.attendance[meeting] || {}),
          [studentId]: status,
        },
      },
    }));
  }

  function markAll(status) {
    if (!activeCourse) return;
    updateActiveCourse((course) => ({
      ...course,
      attendance: {
        ...course.attendance,
        [selectedMeeting]: course.students.reduce((acc, student) => {
          acc[student.id] = status;
          return acc;
        }, {}),
      },
    }));
  }

  function setNote(value) {
    updateActiveCourse((course) => ({
      ...course,
      notes: { ...course.notes, [selectedMeeting]: value },
    }));
  }

  function exportCsv() {
    if (!activeCourse) return;
    const header = ['NIM', 'Nama', ...meetings.map((meeting) => `Pertemuan ${meeting}`), 'Hadir', 'Izin', 'Sakit', 'Alfa', 'Persentase'];
    const rows = activeCourse.students.map((student) => {
      const counts = countStudent(activeCourse, student.id);
      return [
        student.nim,
        student.name,
        ...meetings.map((meeting) => getStatus(activeCourse, student.id, meeting)),
        counts.H,
        counts.I,
        counts.S,
        counts.A,
        `${counts.percentage}%`,
      ];
    });
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    downloadFile(csv, `${slugify(activeCourse.name)}-absensi.csv`, 'text/csv;charset=utf-8;');
  }

  function exportMeetingCsv() {
    if (!activeCourse) return;
    const header = ['Pertemuan', selectedMeeting, activeCourse.name, activeCourse.day, activeCourse.startTime];
    const rows = activeCourse.students.map((student) => [
      student.nim,
      student.name,
      statusMeta[getStatus(activeCourse, student.id, selectedMeeting)].label,
    ]);
    const csv = [header, ['NIM', 'Nama', 'Status'], ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    downloadFile(csv, `${slugify(activeCourse.name)}-p${selectedMeeting}.csv`, 'text/csv;charset=utf-8;');
  }

  async function copyRecap() {
    if (!activeCourse) return;
    const lines = [
      `Absensi ${activeCourse.name}`,
      `Pertemuan ${selectedMeeting} - ${activeCourse.day}, ${activeCourse.startTime}`,
      `Hadir: ${summary.H}, Izin: ${summary.I}, Sakit: ${summary.S}, Alfa: ${summary.A}`,
      '',
      ...activeCourse.students.map((student, index) => {
        const status = statusMeta[getStatus(activeCourse, student.id, selectedMeeting)].label;
        return `${index + 1}. ${student.name} (${student.nim}) - ${status}`;
      }),
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (!activeCourse) {
    return (
      <main className="app-shell empty-state">
        <section className="hero-panel">
          <span className="eyebrow">ABSENSI PIXEL</span>
          <h1>Mulai dari satu mata kuliah.</h1>
          <p>Tambahkan kelas pertama untuk membuka matriks 16 pertemuan.</p>
          <CourseForm form={courseForm} setForm={setCourseForm} onSubmit={addCourse} />
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">KETUA TINGKAT KIT</span>
          <h1>Absensi Kelas Pixel</h1>
        </div>
        <div className="save-pill">
          <Save size={16} />
          Tersimpan otomatis
        </div>
      </header>

      <section className="dashboard">
        <aside className="sidebar">
          <div className="section-title">
            <BookOpen size={18} />
            Mata Kuliah
          </div>
          <div className="course-list">
            {data.courses.map((course) => (
              <button
                className={`course-card ${course.id === activeCourse.id ? 'active' : ''}`}
                key={course.id}
                onClick={() => setData((current) => ({ ...current, activeCourseId: course.id }))}
              >
                <strong>{course.name}</strong>
                <span>{course.day} / {course.startTime}</span>
              </button>
            ))}
          </div>
          <CourseForm form={courseForm} setForm={setCourseForm} onSubmit={addCourse} compact />
        </aside>

        <section className="workspace">
          <div className="course-header">
            <div>
              <span className="eyebrow">{activeCourse.room}</span>
              <h2>{activeCourse.name}</h2>
              <p>{activeCourse.lecturer} / {activeCourse.day}, {activeCourse.startTime}</p>
            </div>
            <button className="icon-danger" onClick={() => removeCourse(activeCourse.id)} title="Hapus mata kuliah">
              <Trash2 size={18} />
            </button>
          </div>

          <div className="stats-grid">
            <Stat label="Hadir" value={summary.H} tone="green" />
            <Stat label="Izin" value={summary.I} tone="yellow" />
            <Stat label="Sakit" value={summary.S} tone="blue" />
            <Stat label="Alfa" value={summary.A} tone="red" />
            <Stat label="Rasio" value={`${summary.percentage}%`} tone="dark" />
          </div>

          <div className="meeting-strip" aria-label="Pilih pertemuan">
            {meetings.map((meeting) => (
              <button
                key={meeting}
                className={meeting === selectedMeeting ? 'selected' : ''}
                onClick={() => setSelectedMeeting(meeting)}
              >
                {meeting}
              </button>
            ))}
          </div>

          <div className="tool-panel">
            <div className="search-wrap">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama atau NIM"
              />
            </div>
            <div className="action-row">
              <button onClick={() => markAll('H')}><Check size={16} /> Semua Hadir</button>
              <button onClick={exportMeetingCsv}><FileDown size={16} /> Export P{selectedMeeting}</button>
              <button onClick={exportCsv}><Download size={16} /> Export 16x</button>
              <button onClick={copyRecap}><Copy size={16} /> {copied ? 'Tersalin' : 'Salin Rekap'}</button>
            </div>
          </div>

          <div className="note-row">
            <CalendarCheck size={18} />
            <input
              value={activeCourse.notes?.[selectedMeeting] || ''}
              onChange={(event) => setNote(event.target.value)}
              placeholder={`Catatan pertemuan ${selectedMeeting}: materi, dosen pengganti, atau info kelas`}
            />
          </div>

          <form className="student-form" onSubmit={addStudent}>
            <UserPlus size={18} />
            <input
              value={studentForm.nim}
              onChange={(event) => setStudentForm({ ...studentForm, nim: event.target.value })}
              placeholder="NIM"
            />
            <input
              value={studentForm.name}
              onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })}
              placeholder="Nama mahasiswa"
            />
            <button type="submit"><Plus size={16} /> Tambah</button>
          </form>

          <AttendanceTable
            course={activeCourse}
            students={filteredStudents}
            selectedMeeting={selectedMeeting}
            setAttendance={setAttendance}
            removeStudent={removeStudent}
          />
        </section>
      </section>
    </main>
  );
}

function CourseForm({ form, setForm, onSubmit, compact = false }) {
  return (
    <form className={`course-form ${compact ? 'compact' : ''}`} onSubmit={onSubmit}>
      <input
        value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })}
        placeholder="Nama mata kuliah"
      />
      <input
        value={form.lecturer}
        onChange={(event) => setForm({ ...form, lecturer: event.target.value })}
        placeholder="Dosen"
      />
      <input
        value={form.room}
        onChange={(event) => setForm({ ...form, room: event.target.value })}
        placeholder="Ruangan"
      />
      <div className="inline-fields">
        <select value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })}>
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => (
            <option key={day}>{day}</option>
          ))}
        </select>
        <input
          type="time"
          value={form.startTime}
          onChange={(event) => setForm({ ...form, startTime: event.target.value })}
        />
      </div>
      <button type="submit"><Plus size={16} /> Tambah MK</button>
    </form>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AttendanceTable({ course, students, selectedMeeting, setAttendance, removeStudent }) {
  if (!students.length) {
    return (
      <div className="blank-list">
        <Users size={28} />
        <strong>Belum ada mahasiswa yang cocok.</strong>
        <span>Tambahkan data atau ubah kata pencarian.</span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>P{selectedMeeting}</th>
            <th>Rekap 16x</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const current = getStatus(course, student.id, selectedMeeting);
            const counts = countStudent(course, student.id);
            return (
              <tr key={student.id}>
                <td>
                  <div className="student-cell">
                    <strong>{student.name}</strong>
                    <span>{student.nim}</span>
                  </div>
                </td>
                <td>
                  <div className="status-buttons">
                    {Object.entries(statusMeta).map(([status, meta]) => (
                      <button
                        key={status}
                        className={`${meta.className} ${current === status ? 'active' : ''}`}
                        onClick={() => setAttendance(student.id, selectedMeeting, status)}
                        title={meta.label}
                      >
                        {meta.short}
                      </button>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="mini-recap">
                    <span>H {counts.H}</span>
                    <span>I {counts.I}</span>
                    <span>S {counts.S}</span>
                    <span>A {counts.A}</span>
                    <strong>{counts.percentage}%</strong>
                  </div>
                </td>
                <td>
                  <button className="icon-danger" onClick={() => removeStudent(student.id)} title="Hapus mahasiswa">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getStatus(course, studentId, meeting) {
  return course.attendance?.[meeting]?.[studentId] || '-';
}

function countStudent(course, studentId) {
  const counts = { H: 0, I: 0, S: 0, A: 0, '-': 0 };
  meetings.forEach((meeting) => {
    counts[getStatus(course, studentId, meeting)] += 1;
  });
  counts.percentage = Math.round((counts.H / meetings.length) * 100);
  return counts;
}

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'absensi';
}

function downloadFile(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

createRoot(document.getElementById('root')).render(<App />);
