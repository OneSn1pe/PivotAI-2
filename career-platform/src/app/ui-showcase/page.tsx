'use client';

import React, { useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { ToggleSwitch, ToggleSwitchGroup } from '@/components/ui/toggle-switch';
import { 
  AnimatedInput, 
  AnimatedTextArea, 
  AnimatedCheckbox, 
  AnimatedRadio,
  AnimatedSelect 
} from '@/components/ui/animated-form';
import { CircularProgress, StreakVisualizer } from '@/components/progress/ProgressVisualizations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UIShowcase() {
  const [toggleStates, setToggleStates] = useState({
    notifications: true,
    darkMode: false,
    autoSave: true,
    publicProfile: false
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    subscribe: false,
    plan: '',
    country: ''
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-4">UI Components Showcase</h1>
          <p className="text-lg text-gray-600">Phase 3 Design Improvements</p>
        </div>

        {/* Empty States Section */}
        <section>
          <h2 className="text-2xl font-light text-gray-900 mb-8">Empty States with Illustrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  illustration="NoData"
                  title="No data available"
                  description="Start adding data to see insights"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  illustration="NoJobs"
                  title="No jobs found"
                  description="Try adjusting your search filters"
                  action={{
                    label: "Browse all jobs",
                    onClick: () => {}
                  }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  illustration="NoAchievements"
                  title="No achievements yet"
                  description="Complete milestones to earn badges"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Toggle Switches Section */}
        <section>
          <h2 className="text-2xl font-light text-gray-900 mb-8">Toggle Switches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Individual Toggles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ToggleSwitch
                  checked={toggleStates.notifications}
                  onChange={(checked) => setToggleStates(prev => ({ ...prev, notifications: checked }))}
                  size="sm"
                  label="Small toggle"
                  description="This is a small toggle switch"
                />
                <ToggleSwitch
                  checked={toggleStates.darkMode}
                  onChange={(checked) => setToggleStates(prev => ({ ...prev, darkMode: checked }))}
                  size="md"
                  label="Medium toggle (default)"
                  description="This is a medium toggle switch"
                />
                <ToggleSwitch
                  checked={toggleStates.autoSave}
                  onChange={(checked) => setToggleStates(prev => ({ ...prev, autoSave: checked }))}
                  size="lg"
                  label="Large toggle"
                  description="This is a large toggle switch"
                />
                <ToggleSwitch
                  checked={false}
                  onChange={() => {}}
                  disabled
                  label="Disabled toggle"
                  description="This toggle is disabled"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grouped Toggles</CardTitle>
              </CardHeader>
              <CardContent>
                <ToggleSwitchGroup label="Notification Settings">
                  <ToggleSwitch
                    checked={toggleStates.notifications}
                    onChange={(checked) => setToggleStates(prev => ({ ...prev, notifications: checked }))}
                    label="Email notifications"
                    description="Receive updates via email"
                  />
                  <ToggleSwitch
                    checked={toggleStates.darkMode}
                    onChange={(checked) => setToggleStates(prev => ({ ...prev, darkMode: checked }))}
                    label="Push notifications"
                    description="Receive push notifications"
                  />
                  <ToggleSwitch
                    checked={toggleStates.publicProfile}
                    onChange={(checked) => setToggleStates(prev => ({ ...prev, publicProfile: checked }))}
                    label="SMS notifications"
                    description="Receive SMS updates"
                  />
                </ToggleSwitchGroup>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Animated Form Elements */}
        <section>
          <h2 className="text-2xl font-light text-gray-900 mb-8">Animated Form Elements</h2>
          <Card>
            <CardContent className="p-8">
              <form className="space-y-6 max-w-2xl mx-auto">
                <AnimatedInput
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
                
                <AnimatedInput
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  error={formData.email && !formData.email.includes('@') ? 'Please enter a valid email' : undefined}
                />
                
                <AnimatedInput
                  label="Success State"
                  value="Successfully validated!"
                  success
                  readOnly
                />
                
                <AnimatedTextArea
                  label="Message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
                
                <AnimatedSelect
                  label="Country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  options={[
                    { value: 'us', label: 'United States' },
                    { value: 'uk', label: 'United Kingdom' },
                    { value: 'ca', label: 'Canada' },
                    { value: 'au', label: 'Australia' }
                  ]}
                />
                
                <div className="space-y-3">
                  <AnimatedCheckbox
                    checked={formData.subscribe}
                    onChange={(e) => setFormData(prev => ({ ...prev, subscribe: e.target.checked }))}
                    label="Subscribe to newsletter"
                  />
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Select a plan:</p>
                  <AnimatedRadio
                    name="plan"
                    value="free"
                    checked={formData.plan === 'free'}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                    label="Free Plan"
                  />
                  <AnimatedRadio
                    name="plan"
                    value="pro"
                    checked={formData.plan === 'pro'}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                    label="Pro Plan"
                  />
                  <AnimatedRadio
                    name="plan"
                    value="enterprise"
                    checked={formData.plan === 'enterprise'}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                    label="Enterprise Plan"
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Progress Visualizations */}
        <section>
          <h2 className="text-2xl font-light text-gray-900 mb-8">Progress Visualizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Circular Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-around items-center py-6">
                  <CircularProgress value={15} maxValue={50} label="of 50" sublabel="Milestones" />
                  <CircularProgress value={67} maxValue={100} label="of 100" sublabel="Points" size={100} />
                  <CircularProgress value={8} maxValue={10} label="of 10" sublabel="Levels" size={80} strokeWidth={6} />
                </div>
              </CardContent>
            </Card>


            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Streak Visualizer</CardTitle>
              </CardHeader>
              <CardContent>
                <StreakVisualizer streakDays={12} />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}