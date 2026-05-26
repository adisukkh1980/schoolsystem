import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "ใส่ apiKey ของท่าน",
  authDomain: "ใส่ authDomain ของท่าน",
  projectId: "ใส่ projectId ของท่าน",
  storageBucket: "ใส่ storageBucket ของท่าน",
  messagingSenderId: "ใส่ messagingSenderId ของท่าน",
  appId: "ใส่ appId ของท่าน"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collectionName = "students";

const studentForm = document.getElementById("studentForm");
const docIdInput = document.getElementById("docId");
const studentCodeInput = document.getElementById("studentCode");
const studentNameInput = document.getElementById("studentName");
const studentClassInput = document.getElementById("studentClass");
const studentTableBody = document.getElementById("studentTableBody");
const totalStudents = document.getElementById("totalStudents");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

async function loadStudents() {
  studentTableBody.innerHTML = `
    <tr>
      <td colspan="4">กำลังโหลดข้อมูล...</td>
    </tr>
  `;

  try {
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    totalStudents.textContent = snapshot.size;

    if (snapshot.empty) {
      studentTableBody.innerHTML = `
        <tr>
          <td colspan="4">ยังไม่มีข้อมูล</td>
        </tr>
      `;
      return;
    }

    let html = "";

    snapshot.forEach((item) => {
      const data = item.data();

      html += `
        <tr>
          <td>${escapeHtml(data.studentCode || "")}</td>
          <td>${escapeHtml(data.studentName || "")}</td>
          <td>${escapeHtml(data.studentClass || "")}</td>
          <td>
            <button 
              class="edit-btn"
              data-id="${item.id}"
              data-code="${escapeHtml(data.studentCode || "")}"
              data-name="${escapeHtml(data.studentName || "")}"
              data-class="${escapeHtml(data.studentClass || "")}">
              แก้ไข
            </button>

            <button class="delete-btn" data-id="${item.id}">
              ลบ
            </button>
          </td>
        </tr>
      `;
    });

    studentTableBody.innerHTML = html;

  } catch (error) {
    console.error("Load error:", error);
    studentTableBody.innerHTML = `
      <tr>
        <td colspan="4">โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Firebase Config หรือ Rules</td>
      </tr>
    `;
  }
}

studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const docId = docIdInput.value;
  const studentCode = studentCodeInput.value.trim();
  const studentName = studentNameInput.value.trim();
  const studentClass = studentClassInput.value.trim();

  if (!studentCode || !studentName || !studentClass) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "กำลังบันทึก...";

  try {
    if (docId) {
      await updateDoc(doc(db, collectionName, docId), {
        studentCode,
        studentName,
        studentClass,
        updatedAt: serverTimestamp()
      });

      alert("แก้ไขข้อมูลสำเร็จ");
    } else {
      await addDoc(collection(db, collectionName), {
        studentCode,
        studentName,
        studentClass,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert("บันทึกข้อมูลสำเร็จ");
    }

    resetForm();
    await loadStudents();

  } catch (error) {
    console.error("Save error:", error);
    alert("บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Console");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = docIdInput.value ? "อัปเดตข้อมูล" : "บันทึกข้อมูล";
  }
});

studentTableBody.addEventListener("click", async (event) => {
  const target = event.target;

  if (target.classList.contains("edit-btn")) {
    docIdInput.value = target.dataset.id;
    studentCodeInput.value = target.dataset.code;
    studentNameInput.value = target.dataset.name;
    studentClassInput.value = target.dataset.class;

    saveBtn.textContent = "อัปเดตข้อมูล";
    cancelBtn.style.display = "inline-block";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (target.classList.contains("delete-btn")) {
    const id = target.dataset.id;

    if (!confirm("ยืนยันการลบข้อมูลนี้ใช่หรือไม่?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, collectionName, id));
      alert("ลบข้อมูลสำเร็จ");
      await loadStudents();
    } catch (error) {
      console.error("Delete error:", error);
      alert("ลบข้อมูลไม่สำเร็จ");
    }
  }
});

cancelBtn.addEventListener("click", resetForm);

function resetForm() {
  docIdInput.value = "";
  studentCodeInput.value = "";
  studentNameInput.value = "";
  studentClassInput.value = "";
  saveBtn.textContent = "บันทึกข้อมูล";
  cancelBtn.style.display = "none";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadStudents();
