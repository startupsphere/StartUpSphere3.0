import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import loginLogo from "/StartUpSphere_loginLogo.png";

/**
 * Loads an image from a URL or import path and converts it into a base64 PNG Data URL
 */
export async function loadImageAsDataUrl(src) {
  if (!src) return null;
  if (typeof src === "string" && src.startsWith("data:image")) {
    return src;
  }
  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (val) => {
      if (!resolved) {
        resolved = true;
        resolve(val);
      }
    };

    const timeout = setTimeout(() => safeResolve(null), 1500);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 100;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        safeResolve(canvas.toDataURL("image/png"));
      } catch (e) {
        console.warn("Failed to convert image to data URL:", e);
        safeResolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timeout);
      safeResolve(null);
    };
    img.src = src;
  });
}

/**
 * Capture an HTML or SVG element as a crisp PNG Data URL.
 * Attempts html2canvas first (for styled HTML + SVG), falling back to native SVG-to-Canvas.
 */
export async function captureElementAsPng(elementOrId) {
  let element = null;
  if (typeof elementOrId === "string") {
    element = document.getElementById(elementOrId);
  } else {
    element = elementOrId;
  }

  if (!element) {
    console.warn("Capture element not found:", elementOrId);
    return null;
  }

  // 1. Try html2canvas with a 3.5s safety timeout
  try {
    const canvasPromise = html2canvas(element, {
      scale: 1.5, // Crisp rendering with optimal rendering speed and memory usage
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      allowTaint: true,
      ignoreElements: (node) => {
        // Ignore export dropdowns or action buttons when capturing
        return (
          node.classList &&
          (node.classList.contains("chart-export-ignore") ||
            node.getAttribute("data-export-ignore") === "true")
        );
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("html2canvas capture timeout")), 3500)
    );

    const canvas = await Promise.race([canvasPromise, timeoutPromise]);
    return {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width / 1.5,
      height: canvas.height / 1.5,
    };
  } catch (err) {
    console.warn("html2canvas capture failed or timed out, attempting native SVG capture fallback:", err);
  }

  // 2. Fallback: Direct SVG capture
  try {
    const svg = element.querySelector("svg");
    if (!svg) return null;

    const clonedSvg = svg.cloneNode(true);
    const rect = svg.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 300;

    clonedSvg.setAttribute("width", width);
    clonedSvg.setAttribute("height", height);
    clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // Copy computed styles so classes aren't lost
    const origElements = svg.querySelectorAll("*");
    const cloneElements = clonedSvg.querySelectorAll("*");
    for (let i = 0; i < cloneElements.length && i < origElements.length; i++) {
      const origStyle = window.getComputedStyle(origElements[i]);
      const cloneEl = cloneElements[i];
      if (origStyle.fill && origStyle.fill !== "none" && !cloneEl.getAttribute("fill")) {
        cloneEl.setAttribute("fill", origStyle.fill);
      }
      if (origStyle.stroke && origStyle.stroke !== "none" && !cloneEl.getAttribute("stroke")) {
        cloneEl.setAttribute("stroke", origStyle.stroke);
      }
      if (origStyle.fontSize) cloneEl.style.fontSize = origStyle.fontSize;
      if (origStyle.fontFamily) cloneEl.style.fontFamily = origStyle.fontFamily;
    }

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clonedSvg);
    if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    return await new Promise((resolve) => {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width * 2;
          canvas.height = height * 2;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve({
            dataUrl: canvas.toDataURL("image/png"),
            width,
            height,
          });
        } catch (e) {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  } catch (err) {
    console.error("Direct SVG capture fallback also failed:", err);
    return null;
  }
}

/**
 * Triggers a browser download of a dataUrl
 */
export function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Draw consistent branded header for StartUpSphere PDF reports
 */
function drawBrandedHeader(doc, title, subtitle, logoDataUrl) {
  // Brand Header Bar (Deep Navy)
  doc.setFillColor(29, 53, 87);
  doc.rect(0, 0, 210, 36, "F");

  // Accent Line (Electric Blue / Indigo)
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 36, 210, 2, "F");

  // Logo
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 14, 6, 48, 24);
    } catch (e) {
      // Fallback text if logo fails
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("STARTUPSPHERE", 14, 20);
    }
  }

  // Document Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 68, 19);

  // Subtitle
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(224, 231, 255);
  doc.text(subtitle || "StartupSphere Philippines Ecosystem Intelligence", 68, 27);

  // Reset text color
  doc.setTextColor(30, 41, 59);
}

/**
 * Draw footer with page numbers on all pages of the document
 */
function drawPageFooters(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, 284, 196, 284);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);

    // Left: Document info
    doc.text(
      "StartupSphere Philippines • Ecosystem Intelligence & Analytics",
      14,
      290
    );

    // Right: Page number
    doc.text(`Page ${i} of ${totalPages}`, 196, 290, { align: "right" });
  }
}

/**
 * Draw Active Filter Summary Box
 */
function drawFilterSummaryBox(doc, activeFilters, startY = 44) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, 182, 20, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("ACTIVE FILTERS & SCOPE:", 18, startY + 6);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);

  const indText = `Industry: ${activeFilters?.industry || "All Industries"}`;
  const govText = `Gov. Reg: ${activeFilters?.govReg || "All Statuses"}`;
  const trlText = `TRL: ${activeFilters?.trl || "All Levels"}`;
  const metricText = `Leaderboard Metric: ${activeFilters?.metric ? activeFilters.metric.toUpperCase() : "OVERALL"}`;
  const dateText = `Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`;

  doc.text(`${indText}   |   ${govText}   |   ${trlText}`, 18, startY + 12);
  doc.text(`${metricText}   |   Generated: ${dateText}`, 18, startY + 16.5);

  return startY + 24;
}

/**
 * Export a Single Chart as a branded PDF Report
 */
export async function exportSingleChartPdf({
  chartTitle,
  containerId,
  data = [],
  columns = [],
  summaryText = "",
  activeFilters = {},
}) {
  const logoDataUrl = await loadImageAsDataUrl(loginLogo);
  const captureResult = await captureElementAsPng(containerId);

  const doc = new jsPDF("p", "mm", "a4");

  // 1. Header
  drawBrandedHeader(
    doc,
    chartTitle,
    "Individual Chart Analytics Report",
    logoDataUrl
  );

  // 2. Filters block
  let currentY = drawFilterSummaryBox(doc, activeFilters, 42);

  // 3. Summary Callout if available
  if (summaryText) {
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(14, currentY, 182, 12, 1.5, 1.5, "FD");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(67, 56, 202);
    doc.text("ANALYSIS SUMMARY:", 18, currentY + 5);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(79, 70, 229);
    doc.text(summaryText, 18, currentY + 9);

    currentY += 16;
  }

  // 4. Chart Visualization Image
  if (captureResult?.dataUrl) {
    const maxWidth = 182;
    const maxHeight = 85;
    let imgW = maxWidth;
    let imgH = (captureResult.height / captureResult.width) * imgW;

    if (imgH > maxHeight) {
      imgH = maxHeight;
      imgW = (captureResult.width / captureResult.height) * imgH;
    }

    const imgX = 14 + (maxWidth - imgW) / 2;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, imgH + 6, 2, 2, "FD");

    doc.addImage(captureResult.dataUrl, "PNG", imgX, currentY + 3, imgW, imgH);
    currentY += imgH + 11;
  }

  // 5. Data Breakdown Table
  if (data && data.length > 0 && columns && columns.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Detailed Data Breakdown", 14, currentY);

    const tableHeaders = columns.map((col) => col.header);
    const tableBody = data.map((row) =>
      columns.map((col) => {
        if (typeof col.format === "function") {
          return col.format(row[col.dataKey], row);
        }
        return row[col.dataKey] !== undefined && row[col.dataKey] !== null
          ? String(row[col.dataKey])
          : "—";
      })
    );

    autoTable(doc, {
      startY: currentY + 3,
      head: [tableHeaders],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [29, 53, 87],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
        cellPadding: 3,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // 6. Footers
  drawPageFooters(doc);

  // 7. Save
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${chartTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report-${dateStr}.pdf`;
  doc.save(filename);
  return true;
}

/**
 * Export Comprehensive Ecosystem Analytics & Intelligence PDF Report
 * Generates an executive-ready multi-page report containing:
 * - Executive summary & KPI cards
 * - Filter criteria & scope
 * - All analytics visualizations embedded
 * - Data tables for Geographical distribution, Industry performance, Gov compliance, TRL stages, and Top startups
 */
export async function exportComprehensiveAnalyticsPdf({
  activeFilters = {},
  kpis = {},
  geoData = [],
  industryScores = [],
  govCompliance = [],
  trlStages = [],
  topStartups = [],
  chartContainerIds = {},
}) {
  const logoDataUrl = await loadImageAsDataUrl(loginLogo);

  // Capture all available chart images concurrently
  const capturePromises = {
    geo: chartContainerIds.geo ? captureElementAsPng(chartContainerIds.geo) : Promise.resolve(null),
    avgIndustry: chartContainerIds.avgIndustry
      ? captureElementAsPng(chartContainerIds.avgIndustry)
      : Promise.resolve(null),
    growthIndustry: chartContainerIds.growthIndustry
      ? captureElementAsPng(chartContainerIds.growthIndustry)
      : Promise.resolve(null),
    govReg: chartContainerIds.govReg
      ? captureElementAsPng(chartContainerIds.govReg)
      : Promise.resolve(null),
    trl: chartContainerIds.trl ? captureElementAsPng(chartContainerIds.trl) : Promise.resolve(null),
  };

  const captures = {
    geo: await capturePromises.geo,
    avgIndustry: await capturePromises.avgIndustry,
    growthIndustry: await capturePromises.growthIndustry,
    govReg: await capturePromises.govReg,
    trl: await capturePromises.trl,
  };

  const doc = new jsPDF("p", "mm", "a4");

  // ==========================================
  // PAGE 1: EXECUTIVE COVER & SUMMARY
  // ==========================================
  drawBrandedHeader(
    doc,
    "Startup Ecosystem Analytics Report",
    "Official Ecosystem Intelligence, Performance & Statistical Summary",
    logoDataUrl
  );

  let currentY = drawFilterSummaryBox(doc, activeFilters, 42);

  // Executive KPI Cards (4 cards in a 2x2 grid or row)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Executive Summary & Core Metrics", 14, currentY + 2);
  currentY += 6;

  const cardW = 42.5;
  const cardH = 22;
  const cardGap = 4;
  const startX = 14;

  const kpiItems = [
    {
      label: "TOTAL STARTUPS",
      value: String(kpis.totalStartups || 0),
      sub: "Matching filter criteria",
      bg: [238, 242, 255],
      border: [199, 210, 254],
      text: [67, 56, 202],
    },
    {
      label: "TOTAL FUNDING",
      value: `P${kpis.formattedFunding || "0"}`,
      sub: "Ecosystem capital",
      bg: [236, 253, 245],
      border: [167, 243, 208],
      text: [4, 120, 87],
    },
    {
      label: "AVG. PERFORMANCE",
      value: `${kpis.avgScore || "N/A"}/100`,
      sub: "Overall rating",
      bg: [254, 243, 199],
      border: [253, 230, 138],
      text: [180, 83, 9],
    },
    {
      label: "COMPLIANCE RATE",
      value: `${kpis.complianceRate || "0"}%`,
      sub: "Govt. certified",
      bg: [240, 253, 250],
      border: [153, 246, 228],
      text: [13, 148, 136],
    },
  ];

  kpiItems.forEach((kpi, idx) => {
    const x = startX + idx * (cardW + cardGap);
    doc.setFillColor(...kpi.bg);
    doc.setDrawColor(...kpi.border);
    doc.roundedRect(x, currentY, cardW, cardH, 2, 2, "FD");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...kpi.text);
    doc.text(kpi.label, x + 3.5, currentY + 5.5);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(kpi.value, x + 3.5, currentY + 13);

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 3.5, currentY + 18);
  });

  currentY += cardH + 10;

  // Executive Narrative Note
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 22, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Ecosystem Analytical Observations:", 18, currentY + 6);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const narrative = [
    `• Scope: Evaluated ${kpis.totalStartups || 0} startups in ${activeFilters.industry || "all industries"} under ${activeFilters.govReg || "all registration statuses"}.`,
    `• Capitalization: Aggregated funding stands at P${kpis.formattedFunding || "0"} with an average benchmark score of ${kpis.avgScore || "0"}/100.`,
    `• Regulatory Alignment: ${kpis.complianceRate || "0"}% of evaluated entities maintain active credentials with regulatory bodies (BIR/SEC/DTI).`,
  ];
  doc.text(narrative, 18, currentY + 11);

  currentY += 28;

  // Overview Table on Page 1: Sector / Industry Quick Breakdown
  if (industryScores && industryScores.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Industry Distribution & Performance Summary", 14, currentY);

    const indTableRows = industryScores.slice(0, 7).map((item) => [
      item.name || item.industry || "Unknown",
      String(item.count || 0),
      kpis.totalStartups
        ? `${(((item.count || 0) / kpis.totalStartups) * 100).toFixed(1)}%`
        : "—",
      item.overallScore !== undefined ? `${item.overallScore} / 100` : "—",
      item.growthScore !== undefined ? `${item.growthScore} / 100` : "—",
      item.ecosystemScore !== undefined ? `${item.ecosystemScore} / 100` : "—",
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Industry Sector", "Startups", "Share %", "Overall Score", "Growth Score", "Ecosystem Score"]],
      body: indTableRows,
      theme: "grid",
      headStyles: {
        fillColor: [29, 53, 87],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 2.5,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ==========================================
  // PAGE 2: GEOGRAPHICAL DISTRIBUTION
  // ==========================================
  doc.addPage();
  drawBrandedHeader(
    doc,
    "Geographical & Regional Analytics",
    "Startup Density and Regional Footprint Across Philippines",
    logoDataUrl
  );

  currentY = 44;

  if (captures.geo?.dataUrl) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Geographical Distribution Visualization", 14, currentY);
    currentY += 4;

    const maxWidth = 182;
    const maxHeight = 78;
    let imgW = maxWidth;
    let imgH = (captures.geo.height / captures.geo.width) * imgW;
    if (imgH > maxHeight) {
      imgH = maxHeight;
      imgW = (captures.geo.width / captures.geo.height) * imgH;
    }
    const imgX = 14 + (maxWidth - imgW) / 2;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, imgH + 4, 2, 2, "FD");
    doc.addImage(captures.geo.dataUrl, "PNG", imgX, currentY + 2, imgW, imgH);
    currentY += imgH + 10;
  }

  // Geographical Data Table
  if (geoData && geoData.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Regional Density & City Distribution Table", 14, currentY);

    const totalGeoCount = geoData.reduce((sum, item) => sum + (item.value || 0), 0);
    const geoRows = geoData.map((item, idx) => [
      `#${idx + 1}`,
      item.name || "Unknown",
      String(item.value || 0),
      totalGeoCount > 0 ? `${(((item.value || 0) / totalGeoCount) * 100).toFixed(1)}%` : "0%",
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Rank", "City / Region Location", "Startup Count", "Ecosystem Share %"]],
      body: geoRows,
      theme: "grid",
      headStyles: {
        fillColor: [29, 53, 87],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 2.5,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 90 },
        2: { cellWidth: 35 },
        3: { cellWidth: 41 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ==========================================
  // PAGE 3: INDUSTRY BENCHMARK & SCORES
  // ==========================================
  doc.addPage();
  drawBrandedHeader(
    doc,
    "Industry Benchmarks & Scores",
    "Average Performance, Growth, and Ecosystem Scores by Industry",
    logoDataUrl
  );

  currentY = 44;

  if (captures.avgIndustry?.dataUrl) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Average Scores by Industry Visualization", 14, currentY);
    currentY += 4;

    const maxWidth = 182;
    const maxHeight = 78;
    let imgW = maxWidth;
    let imgH = (captures.avgIndustry.height / captures.avgIndustry.width) * imgW;
    if (imgH > maxHeight) {
      imgH = maxHeight;
      imgW = (captures.avgIndustry.width / captures.avgIndustry.height) * imgH;
    }
    const imgX = 14 + (maxWidth - imgW) / 2;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, imgH + 4, 2, 2, "FD");
    doc.addImage(captures.avgIndustry.dataUrl, "PNG", imgX, currentY + 2, imgW, imgH);
    currentY += imgH + 10;
  }

  // Full Industry Scores Table
  if (industryScores && industryScores.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Comprehensive Industry Performance Scorecard", 14, currentY);

    const fullIndRows = industryScores.map((item) => [
      item.name || item.industry || "Unknown",
      String(item.count || 0),
      item.overallScore !== undefined ? `${item.overallScore} / 100` : "—",
      item.growthScore !== undefined ? `${item.growthScore} / 100` : "—",
      item.ecosystemScore !== undefined ? `${item.ecosystemScore} / 100` : "—",
      item.overallScore >= 75 ? "High Performing" : item.overallScore >= 50 ? "Moderate" : "Developing",
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Industry", "Count", "Overall Score", "Growth Score", "Ecosystem Score", "Performance Tier"]],
      body: fullIndRows,
      theme: "grid",
      headStyles: {
        fillColor: [29, 53, 87],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 2.5,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ==========================================
  // PAGE 4: COMPLIANCE & TRL READINESS
  // ==========================================
  doc.addPage();
  drawBrandedHeader(
    doc,
    "Compliance & Technology Readiness",
    "Government Regulatory Status and TRL Maturity Stages",
    logoDataUrl
  );

  currentY = 44;

  // Compliance Section
  if (captures.govReg?.dataUrl) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Government Registration & Compliance Status", 14, currentY);
    currentY += 4;

    const maxWidth = 182;
    const maxHeight = 62;
    let imgW = maxWidth;
    let imgH = (captures.govReg.height / captures.govReg.width) * imgW;
    if (imgH > maxHeight) {
      imgH = maxHeight;
      imgW = (captures.govReg.width / captures.govReg.height) * imgH;
    }
    const imgX = 14 + (maxWidth - imgW) / 2;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, imgH + 4, 2, 2, "FD");
    doc.addImage(captures.govReg.dataUrl, "PNG", imgX, currentY + 2, imgW, imgH);
    currentY += imgH + 8;
  }

  // Compliance Breakdown Table
  if (govCompliance && govCompliance.length > 0) {
    const totalReg = govCompliance.reduce((s, c) => s + (c.count || 0), 0);
    const govRows = govCompliance.map((item) => [
      item.name || "Unknown",
      String(item.count || 0),
      totalReg > 0 ? `${(((item.count || 0) / totalReg) * 100).toFixed(1)}%` : "0%",
      item.name.includes("Unregistered") ? "Pending Certification" : "Regulatory Verified",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Registration Agency / Status", "Startups Count", "Distribution %", "Verification Status"]],
      body: govRows,
      theme: "grid",
      headStyles: {
        fillColor: [29, 53, 87],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 2,
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: [51, 65, 85],
      },
      margin: { left: 14, right: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // TRL Stages Section
  if (trlStages && trlStages.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Technology Readiness Level (TRL) Distribution", 14, currentY);
    currentY += 4;

    const totalTrl = trlStages.reduce((s, c) => s + (c.startups || c.count || 0), 0);
    const trlRows = trlStages.map((item) => [
      item.stage || `TRL Level ${item.level}`,
      String(item.startups || item.count || 0),
      totalTrl > 0
        ? `${(((item.startups || item.count || 0) / totalTrl) * 100).toFixed(1)}%`
        : "0%",
      item.stage?.includes("Concept")
        ? "Early ideation and basic proof of concept"
        : item.stage?.includes("Prototype")
          ? "Functional validation and prototype testing"
          : "Commercial deployment and revenue operations",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Maturity Stage", "Startups", "Share %", "Stage Definition"]],
      body: trlRows,
      theme: "grid",
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 2,
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: [51, 65, 85],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ==========================================
  // PAGE 5: FILTERED STARTUPS DIRECTORY
  // ==========================================
  if (topStartups && topStartups.length > 0) {
    doc.addPage();
    drawBrandedHeader(
      doc,
      "Filtered Startups Directory",
      "Ranked Ecosystem Entities Based on Current Selection Criteria",
      logoDataUrl
    );

    currentY = 44;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Top Ranked Startups (Displaying ${Math.min(topStartups.length, 30)} Entities)`,
      14,
      currentY
    );

    const startupRows = topStartups.slice(0, 30).map((s, idx) => [
      `#${idx + 1}`,
      s.companyName || "Unknown",
      s.industry || "—",
      s.locationName || s.city || "—",
      s.registrationAgency || (s.isGovernmentRegistered ? "Registered" : "Unregistered"),
      s.trlLevel || "—",
      (Number(s.overallScore) || 0).toFixed(1),
      (Number(s.growthScore) || 0).toFixed(1),
      (Number(s.investmentScore) || 0).toFixed(1),
      (Number(s.ecosystemScore) || 0).toFixed(1),
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["#", "Company Name", "Industry", "Location", "Gov. Reg", "TRL", "Overall", "Growth", "Invest.", "Eco."]],
      body: startupRows,
      theme: "grid",
      headStyles: {
        fillColor: [29, 53, 87],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 2,
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 42 },
        2: { cellWidth: 26 },
        3: { cellWidth: 26 },
        4: { cellWidth: 18 },
        5: { cellWidth: 14 },
        6: { cellWidth: 12 },
        7: { cellWidth: 11 },
        8: { cellWidth: 11 },
        9: { cellWidth: 12 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Draw Page Footers
  drawPageFooters(doc);

  // Save the complete report
  const dateStr = new Date().toISOString().split("T")[0];
  const indSlug = (activeFilters.industry || "all").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = `startupsphere-ecosystem-report-${indSlug}-${dateStr}.pdf`;
  doc.save(filename);

  return true;
}

// ============================================================================
// SPECIFIC STARTUP ECOSYSTEM REPORTS BUILDERS
// ============================================================================

/**
 * Common KPI Row Renderer for Ecosystem Reports
 */
function drawReportKpiRow(doc, kpis, startY) {
  const cardW = 42.5;
  const cardH = 20;
  const cardGap = 4;
  const startX = 14;

  kpis.forEach((kpi, idx) => {
    const x = startX + idx * (cardW + cardGap);
    doc.setFillColor(...(kpi.bg || [248, 250, 252]));
    doc.setDrawColor(...(kpi.border || [226, 232, 240]));
    doc.roundedRect(x, startY, cardW, cardH, 2, 2, "FD");

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(kpi.text || [30, 41, 59]));
    doc.text(kpi.label, x + 3.5, startY + 5);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(String(kpi.value), x + 3.5, startY + 12);

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub || "", x + 3.5, startY + 16.5);
  });

  return startY + cardH + 6;
}

/**
 * Common Meta Box Renderer for Ecosystem Reports
 */
function drawReportMetaBox(doc, title, editionDate, description, startY = 42) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, startY, 182, 17, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(`${title} • Edition: ${editionDate || "Current"}`, 18, startY + 5.5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const descText = doc.splitTextToSize(description || "Official StartupSphere Ecosystem Intelligence Report.", 174);
  doc.text(descText, 18, startY + 10.5);

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated on: ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`,
    192,
    startY + 5.5,
    { align: "right" }
  );

  return startY + 22;
}

/**
 * 1. Annual Ecosystem Report
 */
function buildAnnualEcosystemReport(doc, report, data, logoDataUrl) {
  const { totalStartups = 0, calculatedTotalFunding = 0, industries = [], industryData = [], locationData = [], fundingData = [], topStartups = [], formatFundingAmount } = data;

  drawBrandedHeader(
    doc,
    "Annual Startup Ecosystem Report",
    "Comprehensive Statistical Review, Industry Demographics & Ecosystem Benchmarks",
    logoDataUrl
  );

  let currentY = drawReportMetaBox(doc, report.title, report.date, report.description, 42);

  const avgScore = topStartups.length > 0
    ? (topStartups.reduce((sum, s) => sum + (Number(s.overallScore) || 0), 0) / topStartups.length).toFixed(1)
    : "0.0";

  currentY = drawReportKpiRow(doc, [
    { label: "TOTAL STARTUPS", value: String(totalStartups), sub: "Across ecosystem", bg: [238, 242, 255], border: [199, 210, 254], text: [67, 56, 202] },
    { label: "TOTAL CAPITAL", value: `P${formatFundingAmount(calculatedTotalFunding)}`, sub: "Capital deployed", bg: [236, 253, 245], border: [167, 243, 208], text: [4, 120, 87] },
    { label: "ACTIVE SECTORS", value: String(industries.length || industryData.length), sub: "Industries tracked", bg: [254, 243, 199], border: [253, 230, 138], text: [180, 83, 9] },
    { label: "AVG. PERFORMANCE", value: `${avgScore}/100`, sub: "Composite benchmark", bg: [240, 253, 250], border: [153, 246, 228], text: [13, 148, 136] },
  ], currentY);

  // Table 1: Industry Breakdown
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("1. Industry Sector Demographics & Market Share", 14, currentY + 2);

  const indRows = (industryData || []).map((ind) => [
    ind.name || "Unknown",
    String(ind.value || 0),
    totalStartups > 0 ? `${(((ind.value || 0) / totalStartups) * 100).toFixed(1)}%` : "0%",
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [["Industry Sector", "Active Startups", "Ecosystem Share (%)"]],
    body: indRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // Check if we need new page for Regional & Funding
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  // Table 2: Regional Hubs
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("2. Regional Innovation Hubs Distribution", 14, currentY);

  const geoRows = (locationData || []).map((loc) => [
    loc.name || "Unknown",
    String(loc.value || 0),
    totalStartups > 0 ? `${(((loc.value || 0) / totalStartups) * 100).toFixed(1)}%` : "0%",
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Region / Urban Hub", "Startups Count", "Share (%)"]],
    body: geoRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  // Table 3: Top Ecosystem Champions
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("3. Top 10 Ecosystem Champions (Highest Overall Performance)", 14, currentY);

  const champRows = topStartups.slice(0, 10).map((s, idx) => [
    String(idx + 1),
    s.companyName || "Unknown",
    s.industry || "General",
    s.locationName || s.city || "Unknown",
    `${Number(s.overallScore || 0).toFixed(1)} / 100`,
    `${Number(s.growthScore || 0).toFixed(1)}%`,
    s.trlLevel || "N/A",
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [["#", "Company Name", "Industry", "Location", "Overall Score", "Growth Score", "TRL Stage"]],
    body: champRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
}

/**
 * 2. Funding Landscape Report
 */
function buildFundingLandscapeReport(doc, report, data, logoDataUrl) {
  const { totalStartups = 0, calculatedTotalFunding = 0, fundingData = [], topStartups = [], formatFundingAmount } = data;

  drawBrandedHeader(
    doc,
    "Startup Funding Landscape & Capital Analysis",
    "Capital Rounds, Funding Stages & Investment Deployment Benchmarks",
    logoDataUrl
  );

  let currentY = drawReportMetaBox(doc, report.title, report.date, report.description, 42);

  // Compute funding statistics
  const fundedStartups = topStartups.filter((s) => Number(s.totalFunding) > 0);
  const totalFundedCount = fundedStartups.length;
  const fundedRate = totalStartups > 0 ? ((totalFundedCount / totalStartups) * 100).toFixed(1) : "0.0";
  const avgCapital = totalFundedCount > 0 ? calculatedTotalFunding / totalFundedCount : 0;

  // Find dominant stage
  let topStageName = "Seed / Early";
  if (fundingData && fundingData.length > 0) {
    const sortedStages = [...fundingData].sort((a, b) => (b.value || 0) - (a.value || 0));
    if (sortedStages[0]) topStageName = sortedStages[0].name;
  }

  currentY = drawReportKpiRow(doc, [
    { label: "TOTAL CAPITAL RAISED", value: `P${formatFundingAmount(calculatedTotalFunding)}`, sub: "Ecosystem funding", bg: [236, 253, 245], border: [167, 243, 208], text: [4, 120, 87] },
    { label: "FUNDED VENTURES", value: `${totalFundedCount}`, sub: `${fundedRate}% of startups`, bg: [238, 242, 255], border: [199, 210, 254], text: [67, 56, 202] },
    { label: "AVG. CAPITAL / STARTUP", value: `P${formatFundingAmount(avgCapital)}`, sub: "Per funded startup", bg: [254, 243, 199], border: [253, 230, 138], text: [180, 83, 9] },
    { label: "DOMINANT STAGE", value: String(topStageName), sub: "Most common stage", bg: [240, 253, 250], border: [153, 246, 228], text: [13, 148, 136] },
  ], currentY);

  // Table 1: Funding Distribution by Stage
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("1. Funding Distribution by Startup Development Stage", 14, currentY + 2);

  const stageRows = (fundingData || []).map((stage) => [
    stage.name || "Unspecified",
    String(stage.value || 0),
    totalStartups > 0 ? `${(((stage.value || 0) / totalStartups) * 100).toFixed(1)}%` : "0%",
    stage.name === "Seed" ? "Early validation & initial runway"
      : stage.name === "Series A" ? "Product-market fit & commercial scale"
      : stage.name === "Series B" ? "Market expansion & user acquisition"
      : stage.name === "Series C+" ? "Maturity & international expansion"
      : "R&D and foundation building",
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [["Funding Stage", "Ventures Count", "Share (%)", "Stage Capital Focus"]],
    body: stageRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  if (currentY > 190) {
    doc.addPage();
    currentY = 20;
  }

  // Table 2: Top Capitalized Startups
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("2. Top Capitalized Startups (Largest Funding Volumes Raised)", 14, currentY);

  const sortedByFunding = [...topStartups].sort((a, b) => (Number(b.totalFunding) || 0) - (Number(a.totalFunding) || 0));
  const topCapitalRows = sortedByFunding.slice(0, 15).map((s, idx) => [
    String(idx + 1),
    s.companyName || "Unknown",
    s.industry || "General",
    s.fundingStage || "Seed",
    `P${formatFundingAmount(Number(s.totalFunding) || 0)}`,
    s.trlLevel || "TRL 6+",
    `${Number(s.investmentScore || 0).toFixed(1)} / 100`,
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [["#", "Company Name", "Industry", "Funding Stage", "Total Funding Raised", "TRL Level", "Invest. Score"]],
    body: topCapitalRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
}

/**
 * 3. Industry Analysis Report
 */
function buildIndustryAnalysisReport(doc, report, data, logoDataUrl) {
  const { totalStartups = 0, calculatedTotalFunding = 0, industries = [], industryData = [], growthData = [], topStartups = [], formatFundingAmount } = data;

  drawBrandedHeader(
    doc,
    "Industry Sector Benchmark & Comparative Analysis",
    "Sector Market Share, Scoring Benchmarks & Industry Leadership",
    logoDataUrl
  );

  let currentY = drawReportMetaBox(doc, report.title, report.date, report.description, 42);

  const topSector = industryData && industryData.length > 0 ? industryData[0] : { name: "Technology", value: 0 };

  // Calculate industry with highest average score
  const industryScoreMap = {};
  topStartups.forEach((s) => {
    const ind = s.industry || "Other";
    if (!industryScoreMap[ind]) industryScoreMap[ind] = { sum: 0, count: 0 };
    industryScoreMap[ind].sum += Number(s.overallScore) || 0;
    industryScoreMap[ind].count += 1;
  });

  let highestScoreInd = "General";
  let highestScoreVal = 0;
  Object.keys(industryScoreMap).forEach((ind) => {
    const avg = industryScoreMap[ind].sum / industryScoreMap[ind].count;
    if (avg > highestScoreVal) {
      highestScoreVal = avg;
      highestScoreInd = ind;
    }
  });

  currentY = drawReportKpiRow(doc, [
    { label: "ACTIVE SECTORS", value: String(industries.length || industryData.length), sub: "Verticals tracked", bg: [238, 242, 255], border: [199, 210, 254], text: [67, 56, 202] },
    { label: "LARGEST SECTOR", value: String(topSector.name || "Tech"), sub: `${topSector.value || 0} ventures`, bg: [236, 253, 245], border: [167, 243, 208], text: [4, 120, 87] },
    { label: "HIGHEST AVG SCORE", value: String(highestScoreInd), sub: `${highestScoreVal.toFixed(1)}/100 avg`, bg: [254, 243, 199], border: [253, 230, 138], text: [180, 83, 9] },
    { label: "ECOSYSTEM CAPITAL", value: `P${formatFundingAmount(calculatedTotalFunding)}`, sub: "Across all sectors", bg: [240, 253, 250], border: [153, 246, 228], text: [13, 148, 136] },
  ], currentY);

  // Table 1: Comprehensive Industry Breakdown
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("1. Comprehensive Industry Sector Performance & Demographics", 14, currentY + 2);

  const indTableRows = (industryData || []).map((ind) => {
    const indStats = industryScoreMap[ind.name] || { sum: 0, count: ind.value || 1 };
    const avg = indStats.count > 0 ? (indStats.sum / indStats.count).toFixed(1) : "N/A";
    const share = totalStartups > 0 ? (((ind.value || 0) / totalStartups) * 100).toFixed(1) : "0.0";
    return [ind.name || "Unknown", String(ind.value || 0), `${share}%`, `${avg} / 100`, "Active Tracked"];
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [["Industry Sector", "Startups Count", "Market Share (%)", "Avg. Score", "Status"]],
    body: indTableRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  if (currentY > 190) {
    doc.addPage();
    currentY = 20;
  }

  // Table 2: Industry Sector Champions
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("2. Industry Sector Champions (Top Scoring Startup per Sector)", 14, currentY);

  const industryLeaders = [];
  industries.forEach((ind) => {
    const startupsInInd = topStartups.filter((s) => s.industry === ind);
    if (startupsInInd.length > 0) {
      const topInInd = [...startupsInInd].sort((a, b) => (Number(b.overallScore) || 0) - (Number(a.overallScore) || 0))[0];
      industryLeaders.push([
        ind,
        topInInd.companyName || "Unknown",
        `${Number(topInInd.overallScore || 0).toFixed(1)} / 100`,
        `${Number(topInInd.growthScore || 0).toFixed(1)}%`,
        topInInd.trlLevel || "N/A",
      ]);
    }
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Industry Sector", "Leading Startup Venture", "Leader Overall Score", "Growth Score", "TRL Stage"]],
    body: industryLeaders.slice(0, 15),
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
}

/**
 * 4. Regional Performance Report
 */
function buildRegionalPerformanceReport(doc, report, data, logoDataUrl) {
  const { totalStartups = 0, locationData = [], topStartups = [], formatFundingAmount } = data;

  drawBrandedHeader(
    doc,
    "Regional Startup Distribution & Hub Performance",
    "Geographical Innovation Density, Regional Distribution & Hub Analysis",
    logoDataUrl
  );

  let currentY = drawReportMetaBox(doc, report.title, report.date, report.description, 42);

  const topHub = locationData && locationData.length > 0 ? locationData[0] : { name: "National Capital Region", value: 0 };
  const totalRegions = locationData.length || 1;
  const avgPerRegion = (totalStartups / totalRegions).toFixed(1);

  currentY = drawReportKpiRow(doc, [
    { label: "REGIONS COVERED", value: String(totalRegions), sub: "Innovation hubs", bg: [238, 242, 255], border: [199, 210, 254], text: [67, 56, 202] },
    { label: "TOP INNOVATION HUB", value: String(topHub.name || "NCR"), sub: `${topHub.value || 0} active startups`, bg: [236, 253, 245], border: [167, 243, 208], text: [4, 120, 87] },
    { label: "HUB DENSITY", value: `${avgPerRegion} / hub`, sub: "Avg startups per region", bg: [254, 243, 199], border: [253, 230, 138], text: [180, 83, 9] },
    { label: "REGIONAL COVERAGE", value: "100%", sub: "Monitored nationwide", bg: [240, 253, 250], border: [153, 246, 228], text: [13, 148, 136] },
  ], currentY);

  // Table 1: Regional Hubs Breakdown
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("1. Regional Hubs Startup Concentration", 14, currentY + 2);

  const geoRows = (locationData || []).map((loc) => [
    loc.name || "Unknown",
    String(loc.value || 0),
    totalStartups > 0 ? `${(((loc.value || 0) / totalStartups) * 100).toFixed(1)}%` : "0%",
    "Active Innovation Hub",
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [["Region / Urban Center", "Active Startups", "Ecosystem Share (%)", "Classification"]],
    body: geoRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  if (currentY > 190) {
    doc.addPage();
    currentY = 20;
  }

  // Table 2: Regional Ventures Registry
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("2. Regional Startup Ventures Registry", 14, currentY);

  const startupGeoRows = topStartups.slice(0, 20).map((s, idx) => [
    String(idx + 1),
    s.companyName || "Unknown",
    s.locationName || s.city || "NCR",
    s.industry || "General",
    `${Number(s.overallScore || 0).toFixed(1)} / 100`,
    s.trlLevel || "TRL 6",
    s.isGovernmentRegistered ? "Gov. Registered" : "Pending",
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [["#", "Company Name", "Regional Hub / City", "Industry", "Score", "TRL Level", "Compliance"]],
    body: startupGeoRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
}

/**
 * 5. Top Performers Spotlight Report
 */
function buildTopPerformersReport(doc, report, data, logoDataUrl) {
  const { totalStartups = 0, topStartups = [] } = data;

  drawBrandedHeader(
    doc,
    "Top Performers Spotlight & Ecosystem Leaderboard",
    "Composite Scoring, Leaderboard Rankings & Performance Tiers",
    logoDataUrl
  );

  let currentY = drawReportMetaBox(doc, report.title, report.date, report.description, 42);

  const leader = topStartups[0] || { companyName: "N/A", overallScore: 0 };
  const sortedByGrowth = [...topStartups].sort((a, b) => (Number(b.growthScore) || 0) - (Number(a.growthScore) || 0));
  const growthLeader = sortedByGrowth[0] || { companyName: "N/A", growthScore: 0 };
  const sortedByInvest = [...topStartups].sort((a, b) => (Number(b.investmentScore) || 0) - (Number(a.investmentScore) || 0));
  const investLeader = sortedByInvest[0] || { companyName: "N/A", investmentScore: 0 };

  const avgScore = topStartups.length > 0
    ? (topStartups.reduce((sum, s) => sum + (Number(s.overallScore) || 0), 0) / topStartups.length).toFixed(1)
    : "0.0";

  currentY = drawReportKpiRow(doc, [
    { label: "#1 LEADER", value: String(leader.companyName || "N/A"), sub: `${Number(leader.overallScore || 0).toFixed(1)}/100 overall`, bg: [238, 242, 255], border: [199, 210, 254], text: [67, 56, 202] },
    { label: "HIGHEST GROWTH", value: String(growthLeader.companyName || "N/A"), sub: `${Number(growthLeader.growthScore || 0).toFixed(1)}% growth rate`, bg: [236, 253, 245], border: [167, 243, 208], text: [4, 120, 87] },
    { label: "TOP INVESTMENT", value: String(investLeader.companyName || "N/A"), sub: `${Number(investLeader.investmentScore || 0).toFixed(1)}/100 invest score`, bg: [254, 243, 199], border: [253, 230, 138], text: [180, 83, 9] },
    { label: "ECOSYSTEM AVG", value: `${avgScore}/100`, sub: "Composite benchmark", bg: [240, 253, 250], border: [153, 246, 228], text: [13, 148, 136] },
  ], currentY);

  // Table 1: Leaderboard
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("1. Official Top Performers Leaderboard (Top 20 Rankings)", 14, currentY + 2);

  const leaderboardRows = topStartups.slice(0, 20).map((s, idx) => [
    String(idx + 1),
    s.companyName || "Unknown",
    s.industry || "General",
    `${Number(s.overallScore || 0).toFixed(1)}`,
    `${Number(s.growthScore || 0).toFixed(1)}`,
    `${Number(s.investmentScore || 0).toFixed(1)}`,
    `${Number(s.ecosystemScore || 0).toFixed(1)}`,
    s.trlLevel || "N/A",
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [["#", "Company Name", "Industry", "Overall", "Growth", "Invest.", "Eco.", "TRL Stage"]],
    body: leaderboardRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  if (currentY > 200) {
    doc.addPage();
    currentY = 20;
  }

  // Table 2: Performance Tiers
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("2. Performance Tier Classification", 14, currentY);

  const tier1Count = topStartups.filter((s) => Number(s.overallScore) >= 75).length;
  const tier2Count = topStartups.filter((s) => Number(s.overallScore) >= 50 && Number(s.overallScore) < 75).length;
  const tier3Count = topStartups.filter((s) => Number(s.overallScore) < 50).length;
  const n = topStartups.length || 1;

  const tierRows = [
    ["Tier 1: High Performers", "75 - 100", String(tier1Count), `${((tier1Count / n) * 100).toFixed(1)}%`, "Market-ready, established operational traction"],
    ["Tier 2: Emerging Leaders", "50 - 74", String(tier2Count), `${((tier2Count / n) * 100).toFixed(1)}%`, "Scaling operations, strong validation signals"],
    ["Tier 3: Early Contenders", "< 50", String(tier3Count), `${((tier3Count / n) * 100).toFixed(1)}%`, "Early stage, prototype and concept development"],
  ];

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Performance Tier", "Score Bracket", "Startups Count", "Share (%)", "Operational Characteristics"]],
    body: tierRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
}

/**
 * 6. Government Support & Compliance Report
 */
function buildGovernmentSupportReport(doc, report, data, logoDataUrl) {
  const { totalStartups = 0, govComplianceData = [], trlStagesData = [], topStartups = [] } = data;

  drawBrandedHeader(
    doc,
    "Government Compliance & Support Programs Analysis",
    "Agency Registrations (BIR, SEC, DTI), Compliance Rates & TRL Readiness",
    logoDataUrl
  );

  let currentY = drawReportMetaBox(doc, report.title, report.date, report.description, 42);

  // Compute stats
  const getCount = (item) => Number(item?.value ?? item?.count ?? item?.startups ?? 0);
  const registeredStartups = topStartups.filter((s) => s.isGovernmentRegistered === true || (s.registrationAgency && s.registrationAgency.trim().length > 0));
  const registeredCount = registeredStartups.length;
  const complianceRate = totalStartups > 0 ? ((registeredCount / totalStartups) * 100).toFixed(1) : "0.0";

  let topAgency = "SEC / DTI";
  if (Array.isArray(govComplianceData) && govComplianceData.length > 0) {
    const sorted = [...govComplianceData].sort((a, b) => getCount(b) - getCount(a));
    if (sorted[0]) topAgency = `${sorted[0].name || "Agency"} (${getCount(sorted[0])})`;
  }

  const commercializedCount = topStartups.filter((s) => {
    const raw = String(s.trlLevel || "");
    const m = raw.match(/\d+/);
    return m ? Number(m[0]) >= 7 : false;
  }).length;

  currentY = drawReportKpiRow(doc, [
    { label: "GOV. REGISTERED", value: `${registeredCount}`, sub: "Certified ventures", bg: [238, 242, 255], border: [199, 210, 254], text: [67, 56, 202] },
    { label: "COMPLIANCE RATE", value: `${complianceRate}%`, sub: "Of total ecosystem", bg: [236, 253, 245], border: [167, 243, 208], text: [4, 120, 87] },
    { label: "TOP AGENCY", value: String(topAgency), sub: "Dominant accreditation", bg: [254, 243, 199], border: [253, 230, 138], text: [180, 83, 9] },
    { label: "COMMERCIAL TRL (7+)", value: `${commercializedCount}`, sub: "Market validated", bg: [240, 253, 250], border: [153, 246, 228], text: [13, 148, 136] },
  ], currentY);

  // Table 1: Regulatory Agency Compliance
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("1. Regulatory Agency Registration Breakdown", 14, currentY + 2);

  const agencyRows = (Array.isArray(govComplianceData) ? govComplianceData : []).map((agency) => {
    const count = getCount(agency);
    return [
      agency.name || "Agency",
      String(count),
      totalStartups > 0 ? `${((count / totalStartups) * 100).toFixed(1)}%` : "0%",
      agency.name === "Unregistered" ? "Pending Accreditation" : "Fully Certified & Compliant",
    ];
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [["Accreditation Agency / Program", "Startups Count", "Share (%)", "Compliance Status"]],
    body: agencyRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  if (currentY > 190) {
    doc.addPage();
    currentY = 20;
  }

  // Table 2: TRL Stages
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("2. Technology Readiness Level (TRL) Breakdown", 14, currentY);

  const trlRows = (Array.isArray(trlStagesData) ? trlStagesData : []).map((stage) => {
    const stageLabel = String(stage.name || stage.stage || (stage.level ? `TRL ${stage.level}` : "TRL Stage"));
    const stageLower = stageLabel.toLowerCase();
    const levelNum = Number(stage.level ?? (stageLabel.match(/\d+/)?.[0] || 0));
    const count = getCount(stage);
    const isConcept = stageLower.includes("concept") || (levelNum >= 1 && levelNum <= 3);
    const isPrototype = stageLower.includes("prototype") || (levelNum >= 4 && levelNum <= 6);

    return [
      stageLabel,
      isConcept ? "TRL 1 - 3" : isPrototype ? "TRL 4 - 6" : "TRL 7 - 9",
      String(count),
      totalStartups > 0 ? `${((count / totalStartups) * 100).toFixed(1)}%` : "0%",
      isConcept
        ? "Basic principles & formulation"
        : isPrototype
        ? "Testing & operational validation"
        : "Market deployable & proven",
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [["TRL Stage Category", "TRL Level Range", "Startups Count", "Share (%)", "Readiness Description"]],
    body: trlRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  if (currentY > 190) {
    doc.addPage();
    currentY = 20;
  }

  // Table 3: Registered Startups
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("3. Verified Government Registered Startups Registry", 14, currentY);

  const registeredRows = registeredStartups.slice(0, 15).map((s, idx) => [
    String(idx + 1),
    s.companyName || "Unknown",
    s.industry || "General",
    s.registrationAgency || "Government Registered",
    s.trlLevel || "TRL 6",
    `${Number(s.overallScore || 0).toFixed(1)} / 100`,
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [["#", "Company Name", "Industry", "Registration Agency", "TRL Stage", "Overall Score"]],
    body: registeredRows.length > 0 ? registeredRows : [["-", "No registered startups currently recorded", "-", "-", "-", "-"]],
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
}

/**
 * 7. Generic / Custom Report Builder
 */
function buildGenericCustomReport(doc, report, data, logoDataUrl) {
  const { totalStartups = 0, calculatedTotalFunding = 0, topStartups = [], formatFundingAmount } = data;

  drawBrandedHeader(
    doc,
    report.title || "Custom Ecosystem Report",
    "Specialized Analytical Summary & Demographic Intelligence",
    logoDataUrl
  );

  let currentY = drawReportMetaBox(doc, report.title, report.date, report.description, 42);

  const avgScore = topStartups.length > 0
    ? (topStartups.reduce((sum, s) => sum + (Number(s.overallScore) || 0), 0) / topStartups.length).toFixed(1)
    : "0.0";

  currentY = drawReportKpiRow(doc, [
    { label: "TOTAL VENTURES", value: String(topStartups.length || totalStartups), sub: "Matching criteria", bg: [238, 242, 255], border: [199, 210, 254], text: [67, 56, 202] },
    { label: "CAPITAL SUM", value: `P${formatFundingAmount(calculatedTotalFunding)}`, sub: "Tracked funding", bg: [236, 253, 245], border: [167, 243, 208], text: [4, 120, 87] },
    { label: "AVG. RATING", value: `${avgScore}/100`, sub: "Composite score", bg: [254, 243, 199], border: [253, 230, 138], text: [180, 83, 9] },
    { label: "REPORT STATUS", value: "Verified", sub: "Ready for review", bg: [240, 253, 250], border: [153, 246, 228], text: [13, 148, 136] },
  ], currentY);

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Startups Directory & Performance Summary", 14, currentY + 2);

  const customRows = topStartups.slice(0, 25).map((s, idx) => [
    String(idx + 1),
    s.companyName || "Unknown",
    s.industry || "General",
    s.locationName || s.city || "Unknown",
    `${Number(s.overallScore || 0).toFixed(1)}`,
    `${Number(s.growthScore || 0).toFixed(1)}`,
    `${Number(s.investmentScore || 0).toFixed(1)}`,
    s.trlLevel || "N/A",
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [["#", "Company Name", "Industry", "Location", "Overall", "Growth", "Invest.", "TRL Level"]],
    body: customRows,
    theme: "grid",
    headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
}

/**
 * Main dispatcher to export specific report PDF
 */
export async function exportSpecificReportPdf(report, context = {}) {
  const logoDataUrl = await loadImageAsDataUrl(loginLogo);
  const doc = new jsPDF("p", "mm", "a4");

  const titleLower = (report.title || "").toLowerCase();
  const reportId = report.id;

  if (reportId === 2 || titleLower.includes("funding")) {
    buildFundingLandscapeReport(doc, report, context, logoDataUrl);
  } else if (reportId === 3 || titleLower.includes("industry")) {
    buildIndustryAnalysisReport(doc, report, context, logoDataUrl);
  } else if (reportId === 4 || titleLower.includes("regional")) {
    buildRegionalPerformanceReport(doc, report, context, logoDataUrl);
  } else if (reportId === 5 || titleLower.includes("top performer") || titleLower.includes("spotlight")) {
    buildTopPerformersReport(doc, report, context, logoDataUrl);
  } else if (reportId === 6 || titleLower.includes("government")) {
    buildGovernmentSupportReport(doc, report, context, logoDataUrl);
  } else if (reportId === 1 || titleLower.includes("annual")) {
    buildAnnualEcosystemReport(doc, report, context, logoDataUrl);
  } else {
    buildGenericCustomReport(doc, report, context, logoDataUrl);
  }

  drawPageFooters(doc);

  const cleanTitle = (report.title || "ecosystem-report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`${cleanTitle}-${dateStr}.pdf`);
  return true;
}
