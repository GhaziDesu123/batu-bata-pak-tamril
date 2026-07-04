"use client";

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// ── Types (sama kayak di client page) ──
interface ProduksiItem {
  id: number;
  nama_karyawan: string;
  tanggal_laporan: string;
  quantity: number;
  upah_per_bata: number;
  estimasi_upah: number;
}
interface PenjualanItem {
  id: number;
  tanggal_transaksi: string;
  nama_pembeli: string;
  quantity: number;
  harga_per_bata: number;
  total: number;
  notes: string;
}
interface PengeluaranItem {
  id: number;
  tanggal_pengeluaran: string;
  kategori: string;
  deskripsi: string;
  total: number;
}
interface LabaBersih {
  totalPenjualan: number;
  totalPengeluaran: number;
  totalGaji: number;
  totalBiaya: number;
  labaBersih: number;
}
interface GajiItem {
  id: number;
  nama_karyawan: string;
  total_produksi: number;
  upah_per_bata: number;
  total_gaji: number;
  status_pembayaran: string;
  tanggal_pembayaran: string | null;
}

const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1f2937" },
  headerWrap: { marginBottom: 16, borderBottom: 2, borderColor: "#94442e", paddingBottom: 10 },
  companyName: { fontSize: 16, fontWeight: 700, color: "#94442e", marginBottom: 2 },
  title: { fontSize: 12, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#6b7280" },
  printedAt: { fontSize: 8, color: "#9ca3af", marginTop: 4 },
  table: { display: "flex", width: "auto" },
  tableRowHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", borderBottom: 1, borderColor: "#d1d5db", paddingVertical: 5 },
  tableRow: { flexDirection: "row", borderBottom: 1, borderColor: "#f0f0f0", paddingVertical: 4 },
  tableRowTotal: { flexDirection: "row", borderTop: 2, borderColor: "#94442e", paddingVertical: 6, marginTop: 2 },
  cellHeader: { fontSize: 8, fontWeight: 700, color: "#4b5563", paddingHorizontal: 4 },
  cell: { fontSize: 8, paddingHorizontal: 4 },
  cellTotal: { fontSize: 9, fontWeight: 700, color: "#94442e", paddingHorizontal: 4 },
  footerBox: { marginTop: 16, padding: 10, backgroundColor: "#f9fafb", borderRadius: 4 },
  footerLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  footerLabel: { fontSize: 9, color: "#4b5563" },
  footerValue: { fontSize: 9, fontWeight: 700 },
  pageNumber: { position: "absolute", bottom: 20, right: 32, fontSize: 8, color: "#9ca3af" },
});

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function Header({ title, bulan, tahun }: { title: string; bulan: number; tahun: number }) {
  return (
    <View style={styles.headerWrap}>
      <Text style={styles.companyName}>Usaha Batu Bata</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        Periode: {NAMA_BULAN[bulan - 1]} {tahun}
      </Text>
      <Text style={styles.printedAt}>Dicetak: {new Date().toLocaleString("id-ID")}</Text>
    </View>
  );
}

function Footer() {
  return <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`} fixed />;
}

// ── PDF: Produksi ──
export function ProduksiPDF({ data, bulan, tahun }: { data: ProduksiItem[]; bulan: number; tahun: number }) {
  const totalQty = data.reduce((s, i) => s + i.quantity, 0);
  const totalUpah = data.reduce((s, i) => s + i.estimasi_upah, 0);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header title="Laporan Produksi" bulan={bulan} tahun={tahun} />
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.cellHeader, { width: "18%" }]}>Tanggal</Text>
            <Text style={[styles.cellHeader, { width: "32%" }]}>Karyawan</Text>
            <Text style={[styles.cellHeader, { width: "18%", textAlign: "right" }]}>Jumlah (Pcs)</Text>
            <Text style={[styles.cellHeader, { width: "16%", textAlign: "right" }]}>Upah/Bata</Text>
            <Text style={[styles.cellHeader, { width: "16%", textAlign: "right" }]}>Est. Upah</Text>
          </View>
          {data.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={[styles.cell, { width: "18%" }]}>{item.tanggal_laporan}</Text>
              <Text style={[styles.cell, { width: "32%" }]}>{item.nama_karyawan}</Text>
              <Text style={[styles.cell, { width: "18%", textAlign: "right" }]}>{item.quantity.toLocaleString("id-ID")}</Text>
              <Text style={[styles.cell, { width: "16%", textAlign: "right" }]}>{fmtRp(item.upah_per_bata)}</Text>
              <Text style={[styles.cell, { width: "16%", textAlign: "right" }]}>{fmtRp(item.estimasi_upah)}</Text>
            </View>
          ))}
          <View style={styles.tableRowTotal}>
            <Text style={[styles.cellTotal, { width: "50%" }]}>TOTAL</Text>
            <Text style={[styles.cellTotal, { width: "18%", textAlign: "right" }]}>{totalQty.toLocaleString("id-ID")} Pcs</Text>
            <Text style={[styles.cellTotal, { width: "16%" }]}></Text>
            <Text style={[styles.cellTotal, { width: "16%", textAlign: "right" }]}>{fmtRp(totalUpah)}</Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

// ── PDF: Penjualan ──
export function PenjualanPDF({ data, bulan, tahun }: { data: PenjualanItem[]; bulan: number; tahun: number }) {
  const totalQty = data.reduce((s, i) => s + i.quantity, 0);
  const totalRp = data.reduce((s, i) => s + i.total, 0);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header title="Laporan Penjualan" bulan={bulan} tahun={tahun} />
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.cellHeader, { width: "14%" }]}>Tanggal</Text>
            <Text style={[styles.cellHeader, { width: "22%" }]}>Pembeli</Text>
            <Text style={[styles.cellHeader, { width: "14%", textAlign: "right" }]}>Qty (Pcs)</Text>
            <Text style={[styles.cellHeader, { width: "16%", textAlign: "right" }]}>Harga/Bata</Text>
            <Text style={[styles.cellHeader, { width: "16%", textAlign: "right" }]}>Total</Text>
            <Text style={[styles.cellHeader, { width: "18%" }]}>Catatan</Text>
          </View>
          {data.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={[styles.cell, { width: "14%" }]}>{item.tanggal_transaksi}</Text>
              <Text style={[styles.cell, { width: "22%" }]}>{item.nama_pembeli}</Text>
              <Text style={[styles.cell, { width: "14%", textAlign: "right" }]}>{item.quantity.toLocaleString("id-ID")}</Text>
              <Text style={[styles.cell, { width: "16%", textAlign: "right" }]}>{fmtRp(item.harga_per_bata)}</Text>
              <Text style={[styles.cell, { width: "16%", textAlign: "right" }]}>{fmtRp(item.total)}</Text>
              <Text style={[styles.cell, { width: "18%" }]}>{item.notes}</Text>
            </View>
          ))}
          <View style={styles.tableRowTotal}>
            <Text style={[styles.cellTotal, { width: "50%" }]}>TOTAL PENDAPATAN</Text>
            <Text style={[styles.cellTotal, { width: "14%", textAlign: "right" }]}>{totalQty.toLocaleString("id-ID")} Pcs</Text>
            <Text style={[styles.cellTotal, { width: "16%" }]}></Text>
            <Text style={[styles.cellTotal, { width: "16%", textAlign: "right" }]}>{fmtRp(totalRp)}</Text>
            <Text style={[styles.cellTotal, { width: "18%" }]}></Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

// ── PDF: Pengeluaran ──
export function PengeluaranPDF({ data, bulan, tahun }: { data: PengeluaranItem[]; bulan: number; tahun: number }) {
  const total = data.reduce((s, i) => s + i.total, 0);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header title="Laporan Pengeluaran" bulan={bulan} tahun={tahun} />
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.cellHeader, { width: "16%" }]}>Tanggal</Text>
            <Text style={[styles.cellHeader, { width: "20%" }]}>Kategori</Text>
            <Text style={[styles.cellHeader, { width: "44%" }]}>Deskripsi</Text>
            <Text style={[styles.cellHeader, { width: "20%", textAlign: "right" }]}>Total</Text>
          </View>
          {data.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={[styles.cell, { width: "16%" }]}>{item.tanggal_pengeluaran}</Text>
              <Text style={[styles.cell, { width: "20%" }]}>{item.kategori}</Text>
              <Text style={[styles.cell, { width: "44%" }]}>{item.deskripsi}</Text>
              <Text style={[styles.cell, { width: "20%", textAlign: "right" }]}>{fmtRp(item.total)}</Text>
            </View>
          ))}
          <View style={styles.tableRowTotal}>
            <Text style={[styles.cellTotal, { width: "80%" }]}>TOTAL PENGELUARAN</Text>
            <Text style={[styles.cellTotal, { width: "20%", textAlign: "right" }]}>{fmtRp(total)}</Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

// ── PDF: Laba Bersih ──
export function LabaBersihPDF({ data, bulan, tahun }: { data: LabaBersih; bulan: number; tahun: number }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header title="Laporan Laba Bersih" bulan={bulan} tahun={tahun} />
        <View style={styles.footerBox}>
          <View style={styles.footerLine}>
            <Text style={styles.footerLabel}>Total Pendapatan Penjualan</Text>
            <Text style={styles.footerValue}>{fmtRp(data.totalPenjualan)}</Text>
          </View>
          <View style={styles.footerLine}>
            <Text style={styles.footerLabel}>Pengeluaran Operasional</Text>
            <Text style={styles.footerValue}>- {fmtRp(data.totalPengeluaran)}</Text>
          </View>
          <View style={styles.footerLine}>
            <Text style={styles.footerLabel}>Gaji Karyawan (Terbayar)</Text>
            <Text style={styles.footerValue}>- {fmtRp(data.totalGaji)}</Text>
          </View>
          <View style={styles.footerLine}>
            <Text style={styles.footerLabel}>Total Biaya</Text>
            <Text style={styles.footerValue}>{fmtRp(data.totalBiaya)}</Text>
          </View>
          <View style={[styles.footerLine, { marginTop: 8, paddingTop: 8, borderTop: 1, borderColor: "#d1d5db" }]}>
            <Text style={[styles.footerLabel, { fontWeight: 700 }]}>{data.labaBersih >= 0 ? "Laba Bersih" : "Rugi Bersih"}</Text>
            <Text style={[styles.footerValue, { fontSize: 12, color: data.labaBersih >= 0 ? "#16a34a" : "#dc2626" }]}>{fmtRp(Math.abs(data.labaBersih))}</Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

// ── PDF: Gaji ──
export function GajiPDF({ data, bulan, tahun }: { data: GajiItem[]; bulan: number; tahun: number }) {
  const totalGaji = data.reduce((s, i) => s + i.total_gaji, 0);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header title="Laporan Gaji Karyawan" bulan={bulan} tahun={tahun} />
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.cellHeader, { width: "26%" }]}>Karyawan</Text>
            <Text style={[styles.cellHeader, { width: "18%", textAlign: "right" }]}>Total Produksi</Text>
            <Text style={[styles.cellHeader, { width: "16%", textAlign: "right" }]}>Upah/Bata</Text>
            <Text style={[styles.cellHeader, { width: "18%", textAlign: "right" }]}>Total Gaji</Text>
            <Text style={[styles.cellHeader, { width: "12%", textAlign: "center" }]}>Status</Text>
            <Text style={[styles.cellHeader, { width: "10%" }]}>Tgl Bayar</Text>
          </View>
          {data.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={[styles.cell, { width: "26%" }]}>{item.nama_karyawan}</Text>
              <Text style={[styles.cell, { width: "18%", textAlign: "right" }]}>{item.total_produksi.toLocaleString("id-ID")} Pcs</Text>
              <Text style={[styles.cell, { width: "16%", textAlign: "right" }]}>{fmtRp(item.upah_per_bata)}</Text>
              <Text style={[styles.cell, { width: "18%", textAlign: "right" }]}>{fmtRp(item.total_gaji)}</Text>
              <Text style={[styles.cell, { width: "12%", textAlign: "center" }]}>{item.status_pembayaran === "paid" ? "Lunas" : "Belum"}</Text>
              <Text style={[styles.cell, { width: "10%" }]}>{item.tanggal_pembayaran || "-"}</Text>
            </View>
          ))}
          <View style={styles.tableRowTotal}>
            <Text style={[styles.cellTotal, { width: "60%" }]}>TOTAL GAJI</Text>
            <Text style={[styles.cellTotal, { width: "18%", textAlign: "right" }]}>{fmtRp(totalGaji)}</Text>
            <Text style={[styles.cellTotal, { width: "22%" }]}></Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
