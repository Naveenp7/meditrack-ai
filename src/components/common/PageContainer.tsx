import React, { ReactNode } from 'react';
import { Box, Container, Paper, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navigation from './Navigation';

interface BreadcrumbItem {
  label: string;
  link?: string;
}

interface PageContainerProps {
  children: ReactNode;
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  padding?: number;
  navigation?: boolean;
  navigationTitle?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  breadcrumbs,
  maxWidth = 'lg',
  padding = 3,
  navigation = true,
  navigationTitle,
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: 'beforeChildren',
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {navigation && <Navigation title={navigationTitle} />}
      
      <Container maxWidth={maxWidth} sx={{ flexGrow: 1, py: 4 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {breadcrumbs && breadcrumbs.length > 0 && (
            <motion.div variants={itemVariants}>
              <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                {breadcrumbs.map((item, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  
                  return isLast ? (
                    <Typography color="text.primary" key={index}>
                      {item.label}
                    </Typography>
                  ) : (
                    <Link 
                      component={RouterLink} 
                      to={item.link || '#'} 
                      underline="hover" 
                      color="inherit"
                      key={index}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </Breadcrumbs>
            </motion.div>
          )}
          
          <motion.div variants={itemVariants}>
            <Typography variant="h4" component="h1" gutterBottom>
              {title}
            </Typography>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: padding,
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              {children}
            </Paper>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default PageContainer;