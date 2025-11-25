import React, { useState, ReactNode } from 'react';

import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';

interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  badge?: number;
  children?: NavItem[];
}

interface DashboardLayoutProps {
  children: ReactNode;
  navigation?: NavItem[];
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  onNavigate?: (item: NavItem) => void;
  currentPath?: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  collapsible?: boolean;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navigation = [],
  header,
  sidebar,
  footer,
  onNavigate,
  currentPath,
  userName,
  userEmail,
  userAvatar,
  collapsible = true,
  className = '',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleNavigate = (item: NavItem) => {
    if (onNavigate) {
      onNavigate(item);
    }
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <View className={`flex-1 flex-row bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Sidebar */}
      {(sidebarOpen || mobileMenuOpen) && (
        <View
          className={`${
            isMobile
              ? 'absolute inset-0 z-50 bg-white dark:bg-gray-800'
              : sidebarOpen
              ? 'w-64'
              : 'w-20'
          } border-r border-gray-200 dark:border-gray-700 flex-shrink-0`}
        >
          <ScrollView className="flex-1">
            {/* User Profile Section */}
            {userName && (
              <View className="p-4 border-b border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center space-x-3">
                  <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center">
                    <Text className="text-white font-bold text-lg">
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  {(sidebarOpen || mobileMenuOpen) && (
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                        {userName}
                      </Text>
                      {userEmail && (
                        <Text className="text-xs text-gray-600 dark:text-gray-400">
                          {userEmail}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Custom Sidebar Content */}
            {sidebar}

            {/* Navigation Items */}
            {navigation.length > 0 && (
              <View className="py-4">
                {navigation.map((item) => (
                  <NavigationItem
                    key={item.id}
                    item={item}
                    collapsed={!sidebarOpen && !mobileMenuOpen}
                    isActive={currentPath === item.href}
                    onPress={handleNavigate}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Collapse Toggle */}
          {collapsible && !isMobile && (
            <Pressable
              onPress={toggleSidebar}
              className="p-4 border-t border-gray-200 dark:border-gray-700"
            >
              <Text className="text-sm text-center text-gray-600 dark:text-gray-400">
                {sidebarOpen ? '← Collapse' : '→'}
              </Text>
            </Pressable>
          )}

          {/* Mobile Close Button */}
          {isMobile && mobileMenuOpen && (
            <Pressable
              onPress={() => setMobileMenuOpen(false)}
              className="p-4 border-t border-gray-200 dark:border-gray-700"
            >
              <Text className="text-sm text-center text-red-600">Close Menu</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Main Content Area */}
      <View className="flex-1">
        {/* Header */}
        {header ? (
          header
        ) : (
          <View className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <View className="flex-row items-center justify-between">
              <Pressable onPress={toggleSidebar}>
                <Text className="text-2xl">☰</Text>
              </Pressable>
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </Text>
              <View className="w-8" />
            </View>
          </View>
        )}

        {/* Main Content */}
        <ScrollView className="flex-1 p-6">{children}</ScrollView>

        {/* Footer */}
        {footer && (
          <View className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </View>
        )}
      </View>

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <Pressable
          onPress={() => setMobileMenuOpen(false)}
          className="absolute inset-0 bg-black/50 z-40"
        />
      )}
    </View>
  );
};

interface NavigationItemProps {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  onPress: (item: NavItem) => void;
  level?: number;
}

const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  collapsed,
  isActive,
  onPress,
  level = 0,
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const handlePress = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else {
      onPress(item);
    }
  };

  return (
    <View>
      <Pressable
        onPress={handlePress}
        className={`flex-row items-center px-4 py-3 ${
          level > 0 ? `ml-${level * 4}` : ''
        } ${
          isActive
            ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        {item.icon && !collapsed && (
          <Text className="text-lg mr-3">{item.icon}</Text>
        )}
        {!collapsed && (
          <View className="flex-1 flex-row items-center justify-between">
            <Text
              className={`text-sm font-medium ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {item.label}
            </Text>
            <View className="flex-row items-center space-x-2">
              {item.badge !== undefined && item.badge > 0 && (
                <View className="bg-red-500 rounded-full px-2 py-0.5 min-w-[20px] items-center">
                  <Text className="text-xs text-white font-bold">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
              {hasChildren && (
                <Text className="text-gray-500">{expanded ? '▼' : '▶'}</Text>
              )}
            </View>
          </View>
        )}
        {collapsed && item.icon && (
          <Text className="text-lg">{item.icon}</Text>
        )}
      </Pressable>

      {/* Child Items */}
      {hasChildren && expanded && !collapsed && (
        <View>
          {item.children!.map((child) => (
            <NavigationItem
              key={child.id}
              item={child}
              collapsed={collapsed}
              isActive={currentPath === child.href}
              onPress={onPress}
              level={level + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Dashboard Grid System
interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: number;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 3,
  gap = 4,
  className = '',
}) => {
  const gridClass = `grid-cols-${cols}`;
  const gapClass = `gap-${gap}`;

  return (
    <View className={`flex-row flex-wrap -mx-${gap / 2} ${className}`}>
      {React.Children.map(children, (child) => (
        <View className={`w-${12 / cols}/12 px-${gap / 2} mb-${gap}`}>
          {child}
        </View>
      ))}
    </View>
  );
};

// Dashboard Card
interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  hoverable?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  actions,
  footer,
  className = '',
  hoverable = false,
  onPress,
}) => {
  const Component = onPress ? Pressable : View;

  return (
    <Component
      onPress={onPress}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${
        hoverable ? 'hover:shadow-md transition-shadow' : ''
      } ${className}`}
    >
      {(title || subtitle || actions) && (
        <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-row items-center justify-between">
          <View className="flex-1">
            {title && (
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </Text>
            )}
          </View>
          {actions && <View className="ml-4">{actions}</View>}
        </View>
      )}
      <View className="px-6 py-4">{children}</View>
      {footer && (
        <View className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          {footer}
        </View>
      )}
    </Component>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = 'neutral',
  className = '',
}) => {
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
      ? 'text-red-600'
      : 'text-gray-600';

  return (
    <Card className={className}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </Text>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </Text>
          {change !== undefined && (
            <View className="flex-row items-center mt-2">
              <Text className={`text-sm font-medium ${trendColor}`}>
                {change > 0 ? '+' : ''}
                {change}%
              </Text>
              {changeLabel && (
                <Text className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  {changeLabel}
                </Text>
              )}
            </View>
          )}
        </View>
        {icon && (
          <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg items-center justify-center">
            <Text className="text-2xl">{icon}</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

// Example Usage
export const ExampleDashboard = () => {
  const navigation: NavItem[] = [
    { id: '1', label: 'Dashboard', icon: '📊', href: '/dashboard' },
    { id: '2', label: 'Escrows', icon: '🔒', href: '/escrows', badge: 5 },
    { id: '3', label: 'Transactions', icon: '💰', href: '/transactions' },
    {
      id: '4',
      label: 'Settings',
      icon: '⚙️',
      href: '/settings',
      children: [
        { id: '4-1', label: 'Profile', href: '/settings/profile' },
        { id: '4-2', label: 'Security', href: '/settings/security' },
        { id: '4-3', label: 'Notifications', href: '/settings/notifications' },
      ],
    },
  ];

  return (
    <DashboardLayout
      navigation={navigation}
      userName="John Doe"
      userEmail="john@example.com"
      currentPath="/dashboard"
      onNavigate={(item) => console.log('Navigate to:', item.href)}
    >
      <Grid cols={3} gap={6}>
        <StatCard
          title="Total Escrows"
          value="1,234"
          change={12.5}
          changeLabel="from last month"
          icon="🔒"
          trend="up"
        />
        <StatCard
          title="Active Transactions"
          value="$456K"
          change={-3.2}
          changeLabel="from last week"
          icon="💰"
          trend="down"
        />
        <StatCard
          title="Completion Rate"
          value="98.5%"
          change={0.8}
          changeLabel="from yesterday"
          icon="✓"
          trend="up"
        />
      </Grid>

      <Card title="Recent Activity" className="mt-6">
        <Text className="text-gray-700 dark:text-gray-300">
          Your recent transactions and activities will appear here.
        </Text>
      </Card>
    </DashboardLayout>
  );
};

