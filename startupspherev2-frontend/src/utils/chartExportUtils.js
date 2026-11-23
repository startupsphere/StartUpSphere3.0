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
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 100;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        console.warn("Failed to convert image to data URL:", e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
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

  // 1. Try html2canvas
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High-DPI for crisp PDF rendering
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
    return {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width / 2,
      height: canvas.height / 2,
    };
  } catch (err) {
    console.warn("html2canvas capture failed, attempting native SVG capture fallback:", err);
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
