// Data GeoJSON untuk boundaries Kabupaten Bekasi dan Kecamatan-kecamatannya
// Data ini adalah contoh, untuk data yang akurat silakan ambil dari Geoportal/BIG

export const bekasiBoundaries = {
  kabupaten: {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {
          name: "Bekasi",
          admin_level: "6"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [106.8447, -6.1204],
            [107.1881, -6.1204],
            [107.1881, -6.4204],
            [106.8447, -6.4204],
            [106.8447, -6.1204]
          ]]
        }
      }
    ]
  },
  kecamatan: {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {
          name: "Cikarang Barat",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.1200, -6.2600],
            [107.1800, -6.2600],
            [107.1800, -6.3200],
            [107.1200, -6.3200],
            [107.1200, -6.2600]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Cikarang Timur",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.1800, -6.2600],
            [107.2400, -6.2600],
            [107.2400, -6.3200],
            [107.1800, -6.3200],
            [107.1800, -6.2600]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Cikarang Utara",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.1200, -6.2000],
            [107.1800, -6.2000],
            [107.1800, -6.2600],
            [107.1200, -6.2600],
            [107.1200, -6.2000]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Cikarang Selatan",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.1200, -6.3200],
            [107.1800, -6.3200],
            [107.1800, -6.3800],
            [107.1200, -6.3800],
            [107.1200, -6.3200]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Cibitung",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.0600, -6.2600],
            [107.1200, -6.2600],
            [107.1200, -6.3200],
            [107.0600, -6.3200],
            [107.0600, -6.2600]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Bekasi Utara",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.0000, -6.2000],
            [107.0600, -6.2000],
            [107.0600, -6.2600],
            [107.0000, -6.2600],
            [107.0000, -6.2000]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Bekasi Timur",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.0600, -6.2000],
            [107.1200, -6.2000],
            [107.1200, -6.2600],
            [107.0600, -6.2600],
            [107.0600, -6.2000]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Bekasi Selatan",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.0000, -6.2600],
            [107.0600, -6.2600],
            [107.0600, -6.3200],
            [107.0000, -6.3200],
            [107.0000, -6.2600]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Tambelang",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [106.9400, -6.2600],
            [107.0000, -6.2600],
            [107.0000, -6.3200],
            [106.9400, -6.3200],
            [106.9400, -6.2600]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Tarumajaya",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [106.9400, -6.2000],
            [107.0000, -6.2000],
            [107.0000, -6.2600],
            [106.9400, -6.2600],
            [106.9400, -6.2000]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Sukatani",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [106.8800, -6.2000],
            [106.9400, -6.2000],
            [106.9400, -6.2600],
            [106.8800, -6.2600],
            [106.8800, -6.2000]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Sukawangi",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [106.8800, -6.2600],
            [106.9400, -6.2600],
            [106.9400, -6.3200],
            [106.8800, -6.3200],
            [106.8800, -6.2600]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Pebayuran",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.0600, -6.1400],
            [107.1200, -6.1400],
            [107.1200, -6.2000],
            [107.0600, -6.2000],
            [107.0600, -6.1400]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Cabangbungin",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.1200, -6.1400],
            [107.1800, -6.1400],
            [107.1800, -6.2000],
            [107.1200, -6.2000],
            [107.1200, -6.1400]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Bojongmangu",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.0000, -6.1400],
            [107.0600, -6.1400],
            [107.0600, -6.2000],
            [107.0000, -6.2000],
            [107.0000, -6.1400]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Kedungwaringin",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [106.9400, -6.1400],
            [107.0000, -6.1400],
            [107.0000, -6.2000],
            [106.9400, -6.2000],
            [106.9400, -6.1400]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Karangbahagia",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [106.8800, -6.1400],
            [106.9400, -6.1400],
            [106.9400, -6.2000],
            [106.8800, -6.2000],
            [106.8800, -6.1400]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Muaragembong",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.1800, -6.1400],
            [107.2400, -6.1400],
            [107.2400, -6.2000],
            [107.1800, -6.2000],
            [107.1800, -6.1400]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Serang Baru",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.0000, -6.3200],
            [107.0600, -6.3200],
            [107.0600, -6.3800],
            [107.0000, -6.3800],
            [107.0000, -6.3200]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Cibarusah",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.0600, -6.3200],
            [107.1200, -6.3200],
            [107.1200, -6.3800],
            [107.0600, -6.3800],
            [107.0600, -6.3200]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Cijetmba",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.1200, -6.3800],
            [107.1800, -6.3800],
            [107.1800, -6.4400],
            [107.1200, -6.4400],
            [107.1200, -6.3800]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Babelan",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [107.0600, -6.0800],
            [107.1200, -6.0800],
            [107.1200, -6.1400],
            [107.0600, -6.1400],
            [107.0600, -6.0800]
          ]]
        }
      },
      {
        type: "Feature" as const,
        properties: {
          name: "Setu",
          admin_level: "7"
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [106.9400, -6.3200],
            [107.0000, -6.3200],
            [107.0000, -6.3800],
            [106.9400, -6.3800],
            [106.9400, -6.3200]
          ]]
        }
      }
    ]
  }
};
