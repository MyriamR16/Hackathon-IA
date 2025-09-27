'use client'

import { useState, useEffect } from 'react'

export default function OptimizePage() {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimization, setOptimization] = useState<any>(null)
  const [parameters, setParameters] = useState({
    startDate: '',
    endDate: '',
    mode: 'VEHICULES',
    weights: {
      wA1: 1.0,
      wA2: 1.0,
      wF1: 1.0,
      lambdaFair: 0.1,
      lambdaPref: 0.05
    },
    quotas: {
      min: null,
      max: null
    },
    astreinteNeed: {
      slot2: 2,
      slot3: 2,
      slot4: 2
    }
  })

  // Initialisation des dates par défaut
  useEffect(() => {
    const now = new Date()
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)

    setParameters(prev => ({
      ...prev,
      startDate: startOfNextMonth.toISOString().split('T')[0],
      endDate: endOfNextMonth.toISOString().split('T')[0]
    }))
  }, [])

  const handleOptimize = async () => {
    setIsOptimizing(true)
    
    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: new Date(parameters.startDate).toISOString(),
          endDate: new Date(parameters.endDate).toISOString(),
          mode: parameters.mode,
          weights: parameters.weights,
          quotas: parameters.quotas,
          astreinteNeed: parameters.astreinteNeed
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setOptimization(result)
      } else {
        alert(`Erreur: ${result.detail}`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error)
      alert('Erreur lors de l\'optimisation du planning')
    } finally {
      setIsOptimizing(false)
    }
  }

  const exportToExcel = async () => {
    if (!optimization) return

    try {
      const response = await fetch(
        `/api/export/xlsx?start_date=${parameters.startDate}&end_date=${parameters.endDate}`
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `planning_${parameters.startDate}_${parameters.endDate}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      alert('Erreur lors de l\'export Excel')
    }
  }

  const exportToPdf = async () => {
    if (!optimization) return

    try {
      const response = await fetch(
        `/api/export/pdf?start_date=${parameters.startDate}&end_date=${parameters.endDate}`
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `planning_${parameters.startDate}_${parameters.endDate}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      alert('Erreur lors de l\'export PDF')
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Optimisation du Planning</h1>
          <p className="text-gray-600">
            Configurez les paramètres et lancez l'optimisation automatique du planning des gardes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panneau de configuration */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Paramètres d'optimisation</h3>

              {/* Période */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Période
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={parameters.startDate}
                    onChange={(e) => setParameters(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-fire-red focus:border-fire-red"
                  />
                  <input
                    type="date"
                    value={parameters.endDate}
                    onChange={(e) => setParameters(prev => ({
                      ...prev,
                      endDate: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-fire-red focus:border-fire-red"
                  />
                </div>
              </div>

              {/* Mode d'optimisation */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode d'optimisation
                </label>
                <select
                  value={parameters.mode}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    mode: e.target.value
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-fire-red focus:border-fire-red"
                >
                  <option value="VEHICULES">Max couverture véhicules (A1,A2,F1)</option>
                  <option value="SIMPLIFIE">Besoins simplifiés (C1=3 actifs)</option>
                </select>
                
                <div className="mt-2 text-xs text-gray-600">
                  {parameters.mode === 'VEHICULES' ? (
                    <p>Optimise la dotation complète des engins selon les compétences requises</p>
                  ) : (
                    <p>Mode simplifié : 3 pompiers actifs sur C1, astreinte sur C2-C4</p>
                  )}
                </div>
              </div>

              {/* Poids des véhicules (mode véhicules uniquement) */}
              {parameters.mode === 'VEHICULES' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité des véhicules
                  </label>
                  <div className="space-y-2">
                    {['A1', 'A2', 'F1'].map(vehicle => (
                      <div key={vehicle} className="flex items-center justify-between">
                        <span className="text-sm">{vehicle} (Ambulance {vehicle === 'F1' ? 'Fourgon' : vehicle})</span>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={parameters.weights[`w${vehicle}` as keyof typeof parameters.weights]}
                          onChange={(e) => setParameters(prev => ({
                            ...prev,
                            weights: {
                              ...prev.weights,
                              [`w${vehicle}`]: parseFloat(e.target.value) || 0
                            }
                          }))}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paramètres d'équité */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facteurs d'équité
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Équité des charges</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={parameters.weights.lambdaFair}
                      onChange={(e) => setParameters(prev => ({
                        ...prev,
                        weights: {
                          ...prev.weights,
                          lambdaFair: parseFloat(e.target.value) || 0
                        }
                      }))}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Préférences</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={parameters.weights.lambdaPref}
                      onChange={(e) => setParameters(prev => ({
                        ...prev,
                        weights: {
                          ...prev.weights,
                          lambdaPref: parseFloat(e.target.value) || 0
                        }
                      }))}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Besoins astreinte (mode simplifié) */}
              {parameters.mode === 'SIMPLIFIE' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Besoins astreinte
                  </label>
                  <div className="space-y-2">
                    {[2, 3, 4].map(slot => (
                      <div key={slot} className="flex items-center justify-between">
                        <span className="text-sm">C{slot}</span>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={parameters.astreinteNeed[`slot${slot}` as keyof typeof parameters.astreinteNeed]}
                          onChange={(e) => setParameters(prev => ({
                            ...prev,
                            astreinteNeed: {
                              ...prev.astreinteNeed,
                              [`slot${slot}`]: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton d'optimisation */}
              <button
                onClick={handleOptimize}
                disabled={isOptimizing || !parameters.startDate || !parameters.endDate}
                className={`w-full py-3 px-4 rounded-md font-medium transition-all ${
                  isOptimizing 
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-fire-red hover:bg-red-700 active:scale-98'
                } text-white`}
              >
                {isOptimizing ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle 
                        className="opacity-25" 
                        cx="12" cy="12" r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                        fill="none"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Optimisation en cours...
                  </div>
                ) : (
                  '🚀 Optimiser le Planning'
                )}
              </button>
            </div>
          </div>

          {/* Résultats */}
          <div className="lg:col-span-2">
            {optimization ? (
              <div className="space-y-6">
                {/* KPIs */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">
                    ✅ Optimisation réussie
                  </h3>
                  <p className="text-green-700 mb-4">{optimization.message}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(optimization.kpis).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {typeof value === 'number' ? 
                            (key.includes('taux') ? `${value.toFixed(1)}%` : value.toString()) 
                            : String(value)}
                        </div>
                        <div className="text-xs text-green-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions d'export */}
                <div className="flex space-x-4">
                  <button
                    onClick={exportToExcel}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    📊 Exporter Excel
                  </button>
                  <button
                    onClick={exportToPdf}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    📄 Exporter PDF
                  </button>
                </div>

                {/* Aperçu des assignments */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Aperçu des affectations ({optimization.assignments.length} total)
                    </h3>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Créneau</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pompier</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Véhicule</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {optimization.assignments.slice(0, 50).map((assignment: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {new Date(assignment.date).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              C{assignment.slot}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {assignment.firefighterName}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                assignment.vehicle === 'A1' ? 'vehicle-a1' :
                                assignment.vehicle === 'A2' ? 'vehicle-a2' :
                                assignment.vehicle === 'F1' ? 'vehicle-f1' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {assignment.vehicle}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {assignment.role}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {assignment.onCall ? (
                                <span className="on-call inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                                  Astreinte
                                </span>
                              ) : (
                                <span className="bg-green-100 text-green-800 inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                                  Actif
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {optimization.assignments.length > 50 && (
                      <div className="px-4 py-2 text-sm text-gray-500 text-center bg-gray-50">
                        ... et {optimization.assignments.length - 50} autres affectations
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Prêt à optimiser ?
                </h3>
                <p className="text-gray-500">
                  Configurez les paramètres à gauche et cliquez sur "Optimiser le Planning" 
                  pour générer automatiquement le planning optimal.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
